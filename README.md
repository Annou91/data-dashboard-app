# 📊 Data Dashboard App

> Full-stack web application for industrial data visualization and analysis

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)](https://github.com/features/actions)

---

## 🎯 Context

This dashboard demonstrates a production-ready full-stack architecture:
a Python/FastAPI backend serving a REST API, a React frontend with
interactive charts, PostgreSQL for data persistence, and full
containerization with Docker.

---

## ✨ Features

- 📁 **CSV/Excel data upload** — import datasets directly from the UI
- 📊 **Interactive charts** — line charts, bar charts, filters by date/category
- 📄 **Report export** — generate PDF and Word reports from displayed data
- 🔐 **User authentication** — JWT-based login/register system
- 🐳 **Fully containerized** — one command to run the entire stack
- ⚙️ **CI/CD pipeline** — automated tests on every push via GitHub Actions

---

## 🏗️ Architecture

```
data-dashboard-app/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # Entry point
│   │   ├── routers/       # API routes (auth, data, reports)
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── schemas/       # Pydantic schemas (data validation)
│   │   └── services/      # Business logic
│   ├── tests/             # Pytest unit tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard, Login, Upload pages
│   │   └── services/      # API calls
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Orchestrates backend + frontend + db
└── .github/
    └── workflows/
        └── ci.yml         # GitHub Actions pipeline
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI · SQLAlchemy · Pydantic |
| Frontend | React 18 · Recharts · Axios · TailwindCSS |
| Database | PostgreSQL 15 |
| Auth | JWT (JSON Web Tokens) |
| Reports | python-docx · ReportLab (PDF) |
| DevOps | Docker · Docker Compose · GitHub Actions |

---

## 🚀 Getting started

### Prerequisites

Make sure you have installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

That's it — no need to install Python or Node.js locally.

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/Annou91/data-dashboard-app.git
cd data-dashboard-app

# 2. Create environment file
cp .env.example .env

# 3. Start the full stack
docker-compose up --build
```

Then open:
- **Frontend** → http://localhost:3000
- **Backend API docs** → http://localhost:8000/docs
- **Database** → localhost:5432

### Stop the stack

```bash
docker-compose down
```

---

## 🔑 Environment variables

Copy `.env.example` to `.env` and fill in:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=dashboard_db

# Backend
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

---

## 🧪 Running tests

```bash
# Run backend tests
docker-compose exec backend pytest tests/ -v

# Run with coverage
docker-compose exec backend pytest tests/ --cov=app --cov-report=term
```

---

## 📸 Screenshots

*Coming soon*

---

## 🗺️ Roadmap

- Project setup & Docker configuration
- Backend API (auth + data endpoints)
- Frontend dashboard with charts
- CSV/Excel upload
- Report export (PDF + Word)
- CI/CD pipeline
- Deploy to cloud (Render / Railway)

---

## 👩🏾‍💻 Author

**Anne Tchenang** — Software Engineer  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/anne-tchenang-76b06519b)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Annou91)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
