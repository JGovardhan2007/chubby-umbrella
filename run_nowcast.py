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


def main():
    parser = argparse.ArgumentParser(
        description="SIH 26084: Convective-scale Nowcasting for Thunderstorms, Hail & Cloudbursts (Phase 1)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. generate-sample
    p_gen = subparsers.add_parser("generate-sample", help="Generate synthetic test datasets in NetCDF/CSV/JSON")
    p_gen.add_argument("--output-dir", "-o", default="data/sample", help="Directory to save generated sample dataset")
    p_gen.add_argument("--num-frames", "-n", type=int, default=6, help="Number of sequential time steps")
    p_gen.add_argument("--time-step-min", "-t", type=int, default=10, help="Time interval between steps (minutes)")

    # 2. replay
    p_rep = subparsers.add_parser("replay", help="Run historical event replay")
    p_rep.add_argument("--source", "-s", default="data/sample/replay_sequence_manifest.json", help="Path to manifest JSON or sample directory")
    p_rep.add_argument("--config", "-c", default=None, help="Path to custom config YAML")
    p_rep.add_argument("--lat", type=float, default=13.0827, help="Target site latitude (e.g. 13.0827 for Chennai)")
    p_rep.add_argument("--lon", type=float, default=80.2707, help="Target site longitude (e.g. 80.2707 for Chennai)")
    p_rep.add_argument("--site-name", default="Chennai_Station", help="Target site name")
    p_rep.add_argument("--geojson-out", "-g", default="data/processed/geojson", help="Output directory for GeoJSON products")
    p_rep.add_argument("--delay", "-d", type=float, default=0.0, help="Delay in seconds between replayed frames")

    # 3. evaluate
    p_eval = subparsers.add_parser("evaluate", help="Run model verification metrics on historical storm event")
    p_eval.add_argument("--source", "-s", default="data/sample/replay_sequence_manifest.json", help="Path to manifest JSON or sample directory")
    p_eval.add_argument("--config", "-c", default=None, help="Path to custom config YAML")
    p_eval.add_argument("--report-out", "-r", default="data/processed/evaluation_report.json", help="Path to save evaluation report JSON")

    args = parser.parse_args()

    if args.command == "generate-sample":
        cmd_generate_sample(args)
    elif args.command == "replay":
        cmd_replay(args)
    elif args.command == "evaluate":
        cmd_evaluate(args)


if __name__ == "__main__":
    main()
