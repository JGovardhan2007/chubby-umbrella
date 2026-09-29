"""Configuration loader for Convective-Scale Nowcasting Pipeline (Phase 1)."""

import os
from pathlib import Path
from typing import Any, Dict
import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "default_config.yaml"


def load_config(config_path: str | Path | None = None) -> Dict[str, Any]:
    """Load system configuration from YAML file."""
    path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    if not path.exists():
        raise FileNotFoundError(f"Config file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config
