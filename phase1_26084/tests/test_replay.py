"""Unit tests for Historical Replay and Synthetic Generator."""

from pathlib import Path
import pytest

from phase1_26084.replay.simulator import generate_synthetic_storm_sequence
from phase1_26084.replay.engine import HistoricalReplayEngine


def test_synthetic_generation_and_replay(tmp_path):
    # 1. Generate 3 synthetic frames
    sample_dir = tmp_path / "sample_data"
    manifest = generate_synthetic_storm_sequence(
        output_dir=sample_dir,
        num_frames=3,
        time_step_minutes=10
    )
    assert len(manifest) == 3
    assert (sample_dir / "replay_sequence_manifest.json").exists()

    # 2. Replay
    engine = HistoricalReplayEngine()
    results = engine.run_replay(
        manifest_or_dir=sample_dir / "replay_sequence_manifest.json",
        target_site=(13.1, 80.1, "Test_Site"),
        output_geojson_dir=tmp_path / "geojson_out"
    )

    assert len(results) == 3
    last_res = results[-1]
    assert len(last_res.nowcasts) >= 5
    assert (tmp_path / "geojson_out").exists()
