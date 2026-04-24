import pytest


def test_register_success(client):
    response = client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne",
        "password": "password123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "anne@test.com"
    assert data["username"] == "anne"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne",
        "password": "password123"
    })
    response = client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne2",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_register_duplicate_username(client):
    client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne",
        "password": "password123"
    })
    response = client.post("/auth/register", json={
        "email": "anne2@test.com",
        "username": "anne",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]


def test_login_success(client):
    client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne",
        "password": "password123"
    })
    response = client.post("/auth/login", data={
        "username": "anne",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "anne@test.com",
        "username": "anne",
        "password": "password123"
    })
    response = client.post("/auth/login", data={
        "username": "anne",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/auth/login", data={
        "username": "nobody",
        "password": "password123"
    })
    assert response.status_code == 401