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
