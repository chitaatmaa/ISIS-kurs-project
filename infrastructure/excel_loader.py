import pandas as pd
import io
from entities.measurement import Measurement

REQUIRED_COLUMNS = ["id", "nominal", "fact"]

class ExcelLoader:
    @staticmethod
    def load_measurements_from_bytes(data: bytes) -> list[Measurement]:
        df = pd.read_excel(io.BytesIO(data))
        return ExcelLoader._df_to_measurements(df)

    @staticmethod
    def _df_to_measurements(df: pd.DataFrame) -> list[Measurement]:
        for column in REQUIRED_COLUMNS:
            if column not in df.columns:
                raise Exception(f"Required columns: {REQUIRED_COLUMNS}")
        measurements = []
        for _, row in df.iterrows():
            measurements.append(Measurement(
                id=int(row["id"]),
                nominal=float(row["nominal"]),
                fact=float(row["fact"])
            ))
        return measurements