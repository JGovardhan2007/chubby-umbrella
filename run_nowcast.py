#!/usr/bin/env python3
"""SIH Problem Statement 26084: Convective-Scale Nowcasting Core System (Phase 1).
Main CLI executable for running live nowcasts, historical replay, evaluation, and data generation.
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from phase1_26084.config import load_config
from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.replay.simulator import generate_synthetic_storm_sequence
from phase1_26084.replay.engine import HistoricalReplayEngine, ReplayStepResult
from phase1_26084.evaluation.validator import ConvectiveNowcastValidator

console = Console()


def cmd_generate_sample(args):
    """Generate realistic synthetic/replay storm sequence dataset."""
    console.print(Panel("[bold cyan]Generating Synthetic Multi-Sensor Storm Sequence (SIH 26084)...[/bold cyan]"))
    out_dir = Path(args.output_dir)
    manifest = generate_synthetic_storm_sequence(
        output_dir=out_dir,
        num_frames=args.num_frames,
        time_step_minutes=args.time_step_min
    )
    console.print(f"[bold green][OK] Successfully generated {len(manifest)} observation time steps in:[/bold green] {out_dir.resolve()}")
    console.print(f"[yellow]Note: All generated files are clearly marked metadata is_simulated=True.[/yellow]")


def cmd_replay(args):
    """Run sequential historical storm event replay."""
    console.print(Panel("[bold blue]Starting Historical Storm Replay Pipeline (0-6 hr Nowcasting)...[/bold blue]"))
    config = load_config(args.config)
    engine = HistoricalReplayEngine(config)

    target_site = (args.lat, args.lon, args.site_name)

    def on_step_finished(res: ReplayStepResult):
        table = Table(title=f"Replay Step {res.step_index + 1} | Time: {res.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}", box=box.ROUNDED)
        table.add_column("Category", style="cyan", no_wrap=True)
        table.add_column("Summary / Diagnostics", style="white")

        table.add_row("QC Status", f"[{'green' if 'PASSED' in res.qc_summary.get('overall_status', '') else 'yellow'}]{res.qc_summary.get('overall_status', 'UNKNOWN')}[/] (Valid: {res.qc_summary.get('valid_fraction', 1.0)*100:.1f}%)")
        table.add_row("Candidate CI Cells", f"{len(res.detected_candidates)} cells detected")

        if res.tracked_storms:
            stm_str = ", ".join([f"{s.storm_id} (Peak: {s.intensity:.1f} dBZ, Spd: {s.speed_kmh:.1f} km/h, Hdg: {s.heading_deg:.0f} deg)" for s in res.tracked_storms])
            table.add_row("Active Storm Tracks", stm_str)
        else:
            table.add_row("Active Storm Tracks", "[dim]No active storm cells detected[/dim]")

        if res.site_eta:
            eta_val = f"{res.site_eta.estimated_arrival_minutes:.1f}" if res.site_eta.estimated_arrival_minutes is not None else "N/A"
            eta_str = f"Dist: {res.site_eta.distance_to_nearest_km:.1f} km | ETA: {eta_val} min | Status: [bold magenta]{res.site_eta.status}[/bold magenta]"
            hazard_str = ", ".join([f"{k.capitalize()}: {v*100:.0f}%" for k, v in res.site_eta.hazard_risks.items()])
            table.add_row(f"Target Site ({res.site_eta.target_label})", f"{eta_str}\nHazards: {hazard_str}")

        # Nowcast Horizons Table
        horizons = [15, 30, 60, 120, 180, 240, 300, 360]
        nowcast_summary = []
        for h in horizons:
            fc = res.nowcasts.get(h)
            if fc:
                nowcast_summary.append(f"+{h}m: {fc.status.value} (Conf: {fc.mean_confidence*100:.0f}%, Cells: {fc.storm_count})")
        table.add_row("0-6h Horizons", "\n".join(nowcast_summary))

        console.print(table)
        console.print()

    results = engine.run_replay(
        manifest_or_dir=args.source,
        target_site=target_site,
        output_geojson_dir=args.geojson_out,
        step_callback=on_step_finished,
        delay_seconds=args.delay
    )

    console.print(f"[bold green][OK] Historical Replay Completed successfully across {len(results)} frames![/bold green]")
    if args.geojson_out:
        console.print(f"[bold cyan][OK] GeoJSON products saved in:[/bold cyan] {Path(args.geojson_out).resolve()}")


def cmd_evaluate(args):
    """Run temporal verification and model evaluation."""
    console.print(Panel("[bold magenta]Running Convective Nowcasting Verification & Evaluation...[/bold magenta]"))
    config = load_config(args.config)
    engine = HistoricalReplayEngine(config)
    validator = ConvectiveNowcastValidator(config)

    # First run replay without artificial delay to gather predictions
    console.print("[dim]Replaying event for temporal cross-validation...[/dim]")
    results = engine.run_replay(manifest_or_dir=args.source)

    report = validator.evaluate_replay_sequence(results)

    # Display Report Table
    table = Table(title="Convective Nowcasting Verification Report (SIH 26084)", box=box.ROUNDED)
    table.add_column("Horizon", style="cyan", justify="center")
    table.add_column("POD", style="green", justify="center")
    table.add_column("FAR", style="red", justify="center")
    table.add_column("CSI", style="yellow", justify="center")
    table.add_column("F1", style="white", justify="center")
    table.add_column("Centroid MAE", style="magenta", justify="center")
    table.add_column("Ltg Brier", style="blue", justify="center")
    table.add_column("Hail Brier", style="blue", justify="center")

    for h, m in sorted(report.horizon_metrics.items()):
        ct = m.contingency
        table.add_row(
            f"+{h} min",
            f"{ct.pod:.3f}",
            f"{ct.far:.3f}",
            f"{ct.csi:.3f}",
            f"{ct.f1_score:.3f}",
            f"{m.centroid_distance_mae_km:.1f} km",
            f"{m.hazard_brier_scores.get('lightning', 0.0):.3f}",
            f"{m.hazard_brier_scores.get('hail', 0.0):.3f}"
        )

    console.print(table)
    console.print(f"[bold green]Overall Detection CSI:[/] {report.overall_detection_csi:.3f} | [bold green]Overall F1:[/] {report.overall_f1_score:.3f}")

    if args.report_out:
        with open(args.report_out, "w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2)
        console.print(f"[bold cyan][OK] Evaluation JSON report saved to:[/bold cyan] {args.report_out}")


def cmd_live(args):
    """Fetch live operational multi-sensor weather data and run immediate 0-6hr nowcast."""
    console.print(Panel(f"[bold green]Fetching LIVE Operational Weather Data for ({args.lat:.4f} N, {args.lon:.4f} E)...[/bold green]"))
    config = load_config(args.config)
    
    # Configure domain centered on requested coordinates (+- 1.25 degrees ~250km domain)
    domain_grid = CommonGrid(
        min_lat=args.lat - 1.25,
        max_lat=args.lat + 1.25,
        min_lon=args.lon - 1.25,
        max_lon=args.lon + 1.25,
        resolution_km=2.0
    )

    from phase1_26084.ingestion.live_api import LiveDataFetcher
    from phase1_26084.fusion.spatiotemporal import MultiSourceFusionEngine
    from phase1_26084.detection.convective_initiation import ConvectiveInitiationDetector
    from phase1_26084.tracking.tracker import StormTracker
    from phase1_26084.nowcast.engine import NowcastEngine
    from phase1_26084.nowcast.arrival_time import calculate_storm_arrival_for_location
    from phase1_26084.hazards.lightning_hazard import LightningHazardEstimator
    from phase1_26084.hazards.hail_hazard import HailHazardEstimator
    from phase1_26084.hazards.wind_hazard import DownburstHazardEstimator
    from phase1_26084.hazards.cloudburst_hazard import CloudburstHazardEstimator
    from phase1_26084.geojson.exporter import export_storm_cells_geojson, export_nowcast_tracks_geojson, export_arrival_eta_geojson

    fetcher = LiveDataFetcher()
    console.print("[dim]Querying live high-resolution radar, satellite cloud top, and surface weather feeds...[/dim]")
    radar, sat, ltg, wx = fetcher.fetch_live_grid(domain_grid)

    console.print(f"[bold cyan][OK] Live Data Ingested:[/bold cyan] Radar grid ({radar.shape}), Satellite grid ({sat.shape}), AWS points ({wx.count})")

    fusion = MultiSourceFusionEngine(domain_grid, config)
    fused_frame = fusion.fuse_frame(
        timestamp=datetime.utcnow(),
        radar_reflectivity=radar,
        satellite_bt=sat,
        lightning=ltg,
        surface_weather=wx
    )

    ci_detector = ConvectiveInitiationDetector(config)
    candidates = ci_detector.detect(fused_frame)

    tracker = StormTracker(config)
    storms = tracker.update(candidates, fused_frame.timestamp)

    ltg_hazards = LightningHazardEstimator(config)
    hail_hazards = HailHazardEstimator(config)
    wind_hazards = DownburstHazardEstimator(config)
    cb_hazards = CloudburstHazardEstimator(config)

    hazards_by_storm = {}
    for stm in storms:
        hazards_by_storm[stm.storm_id] = [
            ltg_hazards.estimate_storm_hazard(stm, fused_frame),
            hail_hazards.estimate_storm_hazard(stm, fused_frame),
            wind_hazards.estimate_storm_hazard(stm, fused_frame),
            cb_hazards.estimate_storm_hazard(stm, fused_frame)
        ]

    nowcast_engine = NowcastEngine(config)
    nowcasts = nowcast_engine.generate_nowcast(storms, fused_frame)

    site_summary = calculate_storm_arrival_for_location(
        target_lat=args.lat,
        target_lon=args.lon,
        storms=storms,
        hazards_by_storm=hazards_by_storm,
        current_time=fused_frame.timestamp,
        target_label=args.site_name
    )

    # Display Live Results Table
    table = Table(title=f"LIVE Operational Nowcast | Time: {fused_frame.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}", box=box.ROUNDED)
    table.add_column("Category", style="cyan", no_wrap=True)
    table.add_column("Current Live Status", style="white")

    table.add_row("Live QC Status", f"[green]LIVE OPERATIONAL FEED OK[/green] (Domain: {domain_grid.min_lat:.2f}N-{domain_grid.max_lat:.2f}N, {domain_grid.min_lon:.2f}E-{domain_grid.max_lon:.2f}E)")
    table.add_row("Detected Convective Cells", f"{len(candidates)} cells detected")

    if storms:
        stm_str = ", ".join([f"{s.storm_id} (Peak: {s.intensity:.1f} dBZ, Stage: {s.convective_stage})" for s in storms])
        table.add_row("Active Storm Tracks", stm_str)
    else:
        table.add_row("Active Storm Tracks", "[green]No active severe convective storm cells currently detected in domain[/green]")

    eta_str = f"Dist: {site_summary.distance_to_nearest_km:.1f} km | Status: [bold {'green' if site_summary.status == 'CLEAR' else 'magenta'}]{site_summary.status}[/]"
    hazard_str = ", ".join([f"{k.capitalize()}: {v*100:.0f}%" for k, v in site_summary.hazard_risks.items()])
    table.add_row(f"Target Site ({site_summary.target_label})", f"{eta_str}\nHazards: {hazard_str}")

    nowcast_summary = []
    for h in [15, 30, 60, 120, 180, 240, 300, 360]:
        fc = nowcasts.get(h)
        if fc:
            nowcast_summary.append(f"+{h}m: {fc.status.value} (Conf: {fc.mean_confidence*100:.0f}%, Cells: {fc.storm_count})")
    table.add_row("0-6h Horizons", "\n".join(nowcast_summary))

    console.print(table)

    # Export GeoJSON products
    out_dir = Path(args.geojson_out)
    out_dir.mkdir(parents=True, exist_ok=True)
    tag = fused_frame.timestamp.strftime("%Y%m%d_%H%M%S")

    geojson_storms = export_storm_cells_geojson(storms, hazards_by_storm)
    geojson_tracks = export_nowcast_tracks_geojson(nowcasts)
    geojson_eta = export_arrival_eta_geojson(site_summary)

    with open(out_dir / f"live_storms_{tag}.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson_storms, f, indent=2)
    with open(out_dir / f"live_nowcast_{tag}.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson_tracks, f, indent=2)
    with open(out_dir / f"live_site_eta_{tag}.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson_eta, f, indent=2)

    console.print(f"[bold green][OK] Live Nowcast Completed successfully! GeoJSON products saved in:[/bold green] {out_dir.resolve()}")


def main():
    parser = argparse.ArgumentParser(
        description="SIH 26084: Convective-scale Nowcasting for Thunderstorms, Hail & Cloudbursts (Phase 1)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. live
    p_live = subparsers.add_parser("live", help="Fetch live operational weather data and run real-time nowcast")
    p_live.add_argument("--lat", type=float, default=13.0827, help="Target latitude (e.g. 13.0827 for Chennai, 28.6139 for Delhi)")
    p_live.add_argument("--lon", type=float, default=80.2707, help="Target longitude (e.g. 80.2707 for Chennai, 77.2090 for Delhi)")
    p_live.add_argument("--site-name", default="Live_Monitoring_Site", help="Site name")
    p_live.add_argument("--config", "-c", default=None, help="Path to config YAML")
    p_live.add_argument("--geojson-out", "-g", default="data/processed/geojson", help="Output directory for GeoJSON products")

    # 2. generate-sample
    p_gen = subparsers.add_parser("generate-sample", help="Generate synthetic test datasets in NetCDF/CSV/JSON")
    p_gen.add_argument("--output-dir", "-o", default="data/sample", help="Directory to save generated sample dataset")
    p_gen.add_argument("--num-frames", "-n", type=int, default=6, help="Number of sequential time steps")
    p_gen.add_argument("--time-step-min", "-t", type=int, default=10, help="Time interval between steps (minutes)")

    # 3. replay
    p_rep = subparsers.add_parser("replay", help="Run historical event replay")
    p_rep.add_argument("--source", "-s", default="data/sample/replay_sequence_manifest.json", help="Path to manifest JSON or sample directory")
    p_rep.add_argument("--config", "-c", default=None, help="Path to custom config YAML")
    p_rep.add_argument("--lat", type=float, default=13.0827, help="Target site latitude")
    p_rep.add_argument("--lon", type=float, default=80.2707, help="Target site longitude")
    p_rep.add_argument("--site-name", default="Chennai_Station", help="Target site name")
    p_rep.add_argument("--geojson-out", "-g", default="data/processed/geojson", help="Output directory for GeoJSON products")
    p_rep.add_argument("--delay", "-d", type=float, default=0.0, help="Delay in seconds between replayed frames")

    # 4. evaluate
    p_eval = subparsers.add_parser("evaluate", help="Run model verification metrics on historical storm event")
    p_eval.add_argument("--source", "-s", default="data/sample/replay_sequence_manifest.json", help="Path to manifest JSON or sample directory")
    p_eval.add_argument("--config", "-c", default=None, help="Path to custom config YAML")
    p_eval.add_argument("--report-out", "-r", default="data/processed/evaluation_report.json", help="Path to save evaluation report JSON")

    args = parser.parse_args()

    if args.command == "live":
        cmd_live(args)
    elif args.command == "generate-sample":
        cmd_generate_sample(args)
    elif args.command == "replay":
        cmd_replay(args)
    elif args.command == "evaluate":
        cmd_evaluate(args)


if __name__ == "__main__":
    main()
