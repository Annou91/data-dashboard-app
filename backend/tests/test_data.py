import io
import pytest


def test_upload_csv_success(authenticated_client):
    csv_content = b"date,machine,temperature\n2024-01-01,Machine_A,75.2\n2024-01-02,Machine_B,82.1"
    response = authenticated_client.post(
        "/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test.csv"
    assert data["row_count"] == 2
    assert data["column_count"] == 3


def test_upload_invalid_format(authenticated_client):
    response = authenticated_client.post(
        "/data/upload",
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    )
    assert response.status_code == 400
    assert "Only CSV and Excel files are supported" in response.json()["detail"]


def test_upload_requires_auth(client):
    csv_content = b"date,value\n2024-01-01,100"
    response = client.post(
        "/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 401


def test_get_files_empty(authenticated_client):
    response = authenticated_client.get("/data/files")
    assert response.status_code == 200
    assert response.json() == []


def test_get_files_after_upload(authenticated_client):
    csv_content = b"date,value\n2024-01-01,100\n2024-01-02,200"
    authenticated_client.post(
        "/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    response = authenticated_client.get("/data/files")
    assert response.status_code == 200
    files = response.json()
    assert len(files) == 1
    assert files[0]["original_filename"] == "test.csv"


def test_get_file_data(authenticated_client):
    csv_content = b"date,value\n2024-01-01,100\n2024-01-02,200"
    upload = authenticated_client.post(
        "/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    file_id = upload.json()["id"]
    response = authenticated_client.get(f"/data/files/{file_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert "date" in data["columns"]
    assert "value" in data["columns"]
    assert len(data["data"]) == 2


def test_delete_file(authenticated_client):
    csv_content = b"date,value\n2024-01-01,100"
    upload = authenticated_client.post(
        "/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    file_id = upload.json()["id"]
    response = authenticated_client.delete(f"/data/files/{file_id}")
    assert response.status_code == 204
    files = authenticated_client.get("/data/files").json()
    assert len(files) == 0


def test_get_nonexistent_file(authenticated_client):
    response = authenticated_client.get("/data/files/9999")
    assert response.status_code == 404