use axum::{
    body::Body,
    http::{Request, StatusCode},
};

use backend::models::users::PublicUser;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use setup::setup_test_app;
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

    assert!(api_response["data"]["access_token"].is_string());
    assert!(api_response["data"]["refresh_token"].is_string());
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

#[tokio::test]
async fn test_logout_success() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123"
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
    let access_token = api_response["data"]["access_token"].as_str().unwrap();
    let refresh_token = api_response["data"]["refresh_token"].as_str().unwrap();

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/logout")
                .header("Authorization", format!("Bearer {}", access_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let refresh_payload = json!({
        "refresh_token": refresh_token
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/refresh_token")
                .header("Content-Type", "application/json")
                .body(Body::from(refresh_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_logout_fail_no_token() {
    let app = setup::setup_test_app().await;

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/logout") // 👈 No Authorization header
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_logout_fail_invalid_token() {
    let app = setup::setup_test_app().await;

    let invalid_token = "invalid.jwt.token";

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/logout")
                .header("Authorization", format!("Bearer {}", invalid_token)) // 👈 Fake token
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_refresh_token_success() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Candy",
        "email": "candy1154545@example.com",
        "password": "securepassword123"
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
    let refresh_token = api_response["data"]["refresh_token"].as_str().unwrap();

    let refresh_payload = json!({ "refresh_token": refresh_token });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/refresh_token")
                .header("Content-Type", "application/json")
                .body(Body::from(refresh_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let refreshed_tokens: Value = serde_json::from_slice(&body).unwrap();

    assert!(refreshed_tokens["data"]["access_token"].is_string());
    assert!(refreshed_tokens["data"]["refresh_token"].is_string());
}

#[tokio::test]
async fn test_refresh_token_invalid() {
    let app = setup::setup_test_app().await;

    let invalid_refresh_payload = json!({
        "refresh_token": "invalid.jwt.token"
    });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/refresh_token")
                .header("Content-Type", "application/json")
                .body(Body::from(invalid_refresh_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_refresh_token_old_token_invalid() {
    let app = setup::setup_test_app().await;

    let user_payload = json!({
        "name": "Bob",
        "email": "bob@example.com",
        "password": "securepassword123"
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
    let first_refresh_token = api_response["data"]["refresh_token"].as_str().unwrap();

    let refresh_payload = json!({ "refresh_token": first_refresh_token });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/refresh_token")
                .header("Content-Type", "application/json")
                .body(Body::from(refresh_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let refreshed_api_response: Value = serde_json::from_slice(&body).unwrap();
    let new_refresh_token = refreshed_api_response["data"]["refresh_token"]
        .as_str()
        .unwrap();

    let old_refresh_payload = json!({ "refresh_token": first_refresh_token });

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/refresh_token")
                .header("Content-Type", "application/json")
                .body(Body::from(old_refresh_payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_get_me_success() {
    let app = setup_test_app().await;

    let user_payload = json!({
        "name": "Linda",
        "email": "linda@example.com",
        "password": "securepassword123"
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
    let access_token = api_response["data"]["access_token"].as_str().unwrap();

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/me")
                .header("Authorization", format!("Bearer {}", access_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let user_response: Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(user_response["data"]["email"], "linda@example.com");
    assert_eq!(user_response["data"]["name"], "Linda");
}

async fn test_get_me_invalid_token() {
    let app = setup_test_app().await;

    let invalid_token = "not.a.good.token";

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/me")
                .header("Authorization", format!("Bearer {}", invalid_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
