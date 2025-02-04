use axum::{http::StatusCode, routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health_check() -> (StatusCode, Json<HealthResponse>) {
    (StatusCode::OK, Json(HealthResponse { status: "OK" }))
}

pub fn routes() -> Router {
    Router::new().route("/health", get(health_check))
}
