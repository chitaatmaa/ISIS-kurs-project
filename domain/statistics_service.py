import numpy as np
from scipy.stats import skew
from entities.measurement import Measurement

class StatisticsService:
    @staticmethod
    def calculate_errors(measurements: list[Measurement]) -> list[float]:
        return [m.fact - m.nominal for m in measurements]

    @staticmethod
    def calculate_statistics(errors: list[float]) -> dict:
        errors_np = np.array(errors)
        positive = sum(1 for e in errors if e > 0)
        negative = sum(1 for e in errors if e < 0)
        zero = sum(1 for e in errors if e == 0)

        if np.all(errors_np == errors_np[0]) or len(set(errors)) == 1:
            skewness_val = 0.0
        else:
            with np.errstate(all='ignore'):
                skewness_val = float(skew(errors_np))

        return {
            "n": len(errors),
            "positive": positive,
            "negative": negative,
            "zero": zero,
            "mean": float(np.mean(errors_np)),
            "mean_abs": float(np.mean(np.abs(errors_np))),
            "variance": float(np.var(errors_np)),
            "sigma": float(np.std(errors_np)),
            "skewness": skewness_val,
            "errors": errors
        }