from scipy.stats import shapiro
import numpy as np

class NormalityService:
    @staticmethod
    def check_normality(errors: list[float]) -> dict:
        if np.allclose(errors, errors[0]) if errors else True:
            return {
                "shapiro_w": 1.0,
                "shapiro_p": 0.0,
                "is_normal": False
            }
        statistic, p_value = shapiro(errors)
        return {
            "shapiro_w": float(statistic),
            "shapiro_p": float(p_value),
            "is_normal": p_value > 0.05
        }