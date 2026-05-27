import os
import tempfile

from fastapi import APIRouter
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile

from domain.normality_service import NormalityService
from domain.statistics_service import StatisticsService
from infrastructure.excel_loader import ExcelLoader
from entities.result import AnalyzeResponse


router = APIRouter()


@router.post(
    "/api/v1/analyze",
    response_model=AnalyzeResponse
)
async def analyze(file: UploadFile = File(...)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")

    try:
        contents = await file.read()
        measurements = ExcelLoader.load_measurements_from_bytes(contents)

        errors = StatisticsService.calculate_errors(measurements)
        statistics = StatisticsService.calculate_statistics(errors)
        normality = NormalityService.check_normality(errors)

        result = {**statistics, **normality}
        return AnalyzeResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))