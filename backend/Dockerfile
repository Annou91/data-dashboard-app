FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --timeout=120 --retries=5 \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    sqlalchemy==2.0.23 \
    psycopg2-binary==2.9.9 \
    alembic==1.12.1 \
    python-jose[cryptography]==3.3.0 \
    passlib[bcrypt]==1.7.4 \
    python-multipart==0.0.6 \
    pydantic-settings==2.1.0 \
    pytest==7.4.3 \
    httpx==0.25.2

RUN pip install --no-cache-dir --timeout=120 --retries=5 numpy==1.26.4

RUN pip install --no-cache-dir --timeout=120 --retries=5 pandas==2.1.3

RUN pip install --no-cache-dir --timeout=120 --retries=5 \
    openpyxl==3.1.2 \
    python-docx==1.1.0 \
    reportlab==4.0.7

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]