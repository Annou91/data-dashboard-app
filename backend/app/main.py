from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import routers (on les ajoutera au fur et à mesure)
# from app.routers import auth, data, reports

# Crée toutes les tables en base de données au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Data Dashboard API",
    description="API for industrial data visualization and report generation",
    version="1.0.0",
)

# Configuration CORS — autorise le frontend React à parler au backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Data Dashboard API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}