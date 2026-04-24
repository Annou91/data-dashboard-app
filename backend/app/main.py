import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
from app.models.user import User
from app.models.datafile import DataFile
from app.routers import auth, data, reports

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables_with_retry(retries=5, delay=5):
    for attempt in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
            return
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                logger.error("Could not connect to database after all retries")
                raise


create_tables_with_retry()

app = FastAPI(
    title="Data Dashboard API",
    description="API for industrial data visualization and report generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(data.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Data Dashboard API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}