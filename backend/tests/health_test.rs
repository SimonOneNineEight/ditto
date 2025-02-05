use axum::{
    body::Body,
    http::{self, Request},
};
use hyper::StatusCode;
use tower::ServiceExt;

mod setup;

#[tokio::test]
async fn health() {
    let app = setup::setup_test_app().await;

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::GET)
                .uri("/api/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
