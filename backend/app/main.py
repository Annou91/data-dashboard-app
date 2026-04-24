from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import des modèles AVANT create_all pour que SQLAlchemy connaisse toutes les tables
from app.models.user import User
from app.models.datafile import DataFile

from app.routers import auth, data, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Data Dashboard API",
    description="API for industrial data visualization and report generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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