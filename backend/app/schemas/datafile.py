from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import json


class DataFileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: Optional[float]
    row_count: Optional[int]
    column_count: Optional[int]
    columns_info: Optional[str]
    uploaded_at: datetime
    user_id: int

    class Config:
        from_attributes = True

    def get_columns(self) -> List[str]:
        if self.columns_info:
            return json.loads(self.columns_info)
        return []


class DataResponse(BaseModel):
    filename: str
    rows: int
    columns: List[str]
    data: List[dict]
    total_rows: int
    page: int
    page_size: int