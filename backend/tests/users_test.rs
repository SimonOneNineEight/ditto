use axum::{
    body::Body,
    http::{Request, StatusCode},
};

use backend::models::users::PublicUser;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

mod setup;

#[tokio::test]
async fn test_register_user_success() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Riccado Martiniz",
        "email": "rm@rust.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let api_response: Value = serde_json::from_slice(&body).unwrap();
    let user: PublicUser = serde_json::from_value(api_response["data"].clone()).unwrap();

    assert_eq!(user.name, "Riccado Martiniz");
    assert_eq!(user.email, "rm@rust.com")
}

#[tokio::test]
async fn test_register_user_duplicate_email() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Alice",
        "email": "alice@example.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn test_register_user_invalid_email() {
    let app = setup::setup_test_app().await;

    let invalid_user_payload = json!({
        "name": "Bob",
        "email": "invalid-email",
        "password": "password123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(invalid_user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_login_success() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Kevin Johnson",
        "email": "kj@ditto.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let login_payload = json!({
        "email": "kj@ditto.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/login")
                .header("Content-Type", "application/json")
                .body(Body::from(login_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let api_response: Value = serde_json::from_slice(&body).unwrap();

    assert!(api_response["data"]["access_token"].is_string());
    assert!(api_response["data"]["refresh_token"].is_string());
}

#[tokio::test]
async fn test_login_user_not_exist() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Apple Wood",
        "email": "aw@ditto.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let login_payload = json!({
        "email": "bw@ditto.com",
        "password": "verygoodpassword123"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/login")
                .header("Content-Type", "application/json")
                .body(Body::from(login_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_login_invalid_request_body() {
    let app = setup::setup_test_app().await;

    let invalid_login_payload = json!({});

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/login")
                .header("Content-Type", "application/json")
                .body(Body::from(invalid_login_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}
