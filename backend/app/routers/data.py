import os
import uuid
import json
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt

from app.database import get_db, settings
from app.models.user import User
from app.models.datafile import DataFile
from app.schemas.datafile import DataFileResponse, DataResponse

router = APIRouter(prefix="/data", tags=["Data"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/upload", response_model=DataFileResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported"
        )

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    file_size = len(contents) / 1024

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        row_count = len(df)
        column_count = len(df.columns)
        columns_info = json.dumps(list(df.columns))

    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Could not read file: {str(e)}"
        )

    db_file = DataFile(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=round(file_size, 2),
        row_count=row_count,
        column_count=column_count,
        columns_info=columns_info,
        user_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


@router.get("/files", response_model=List[DataFileResponse])
def get_user_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = db.query(DataFile).filter(
        DataFile.user_id == current_user.id
    ).all()
    return files


@router.get("/files/{file_id}", response_model=DataResponse)
def get_file_data(
    file_id: int,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = db.query(DataFile).filter(
        DataFile.id == file_id,
        DataFile.user_id == current_user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        if db_file.original_filename.endswith('.csv'):
            df = pd.read_csv(db_file.file_path)
        else:
            df = pd.read_excel(db_file.file_path)

        df = df.fillna("")
        total_rows = len(df)
        start = (page - 1) * page_size
        end = start + page_size
        page_df = df.iloc[start:end]

        return DataResponse(
            filename=db_file.original_filename,
            rows=len(page_df),
            columns=list(df.columns),
            data=page_df.to_dict(orient="records"),
            total_rows=total_rows,
            page=page,
            page_size=page_size
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read file data: {str(e)}"
        )


@router.delete("/files/{file_id}", status_code=204)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = db.query(DataFile).filter(
        DataFile.id == file_id,
        DataFile.user_id == current_user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)

    db.delete(db_file)
    db.commit()