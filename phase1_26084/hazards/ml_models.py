"""Modular Machine Learning interface for convective hazard classification and regression.
Supports interpretable physics baseline and scikit-learn / XGBoost / LightGBM models.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, f1_score


class BaseMLHazardModel(ABC):
    """Abstract interface for modular ML hazard models."""

    @abstractmethod
    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs) -> BaseMLHazardModel:
        pass

    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        pass


class InterpretablePhysicsBaseline(BaseMLHazardModel):
    """Interpretable baseline using meteorological physics thresholds."""

    def __init__(self, hazard_type: str = "lightning"):
        self.hazard_type = hazard_type
        self.is_fitted = True

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs) -> InterpretablePhysicsBaseline:
        # Physics baseline is parameter-free / rule-calibrated
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        # X: [N, Features] e.g. [max_dbz, min_bt, cooling_rate, ltg_density, speed]
        if X.ndim == 1:
            X = X.reshape(1, -1)

        dbz = X[:, 0]
        bt = X[:, 1] if X.shape[1] > 1 else np.full_like(dbz, 240.0)

        p1 = np.clip((dbz - 35.0) / 25.0, 0.0, 1.0)
        p2 = np.clip((260.0 - bt) / 50.0, 0.0, 1.0)
        prob_pos = np.clip(0.6 * p1 + 0.4 * p2, 0.0, 1.0)
        prob_neg = 1.0 - prob_pos
        return np.column_stack([prob_neg, prob_pos])

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return (probs[:, 1] >= 0.5).astype(int)


class ModularSklearnHazardClassifier(BaseMLHazardModel):
    """Pluggable Scikit-Learn (Random Forest / Gradient Boosting) classifier wrapper."""

    def __init__(self, model_type: str = "random_forest", **model_params):
        self.model_type = model_type
        if model_type == "random_forest":
            self.model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, **model_params)
        elif model_type == "gradient_boosting":
            self.model = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42, **model_params)
        else:
            raise ValueError(f"Unknown model_type: {model_type}")
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs) -> ModularSklearnHazardClassifier:
        if len(X) < 10:
            raise ValueError("Insufficient training samples for ML model (minimum 10 required).")
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model has not been fitted. Call fit() first.")
        if X.ndim == 1:
            X = X.reshape(1, -1)
        return self.model.predict_proba(X)

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model has not been fitted. Call fit() first.")
        if X.ndim == 1:
            X = X.reshape(1, -1)
        return self.model.predict(X)
