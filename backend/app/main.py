from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, data

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


@app.get("/")
def root():
    return {"message": "Data Dashboard API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}