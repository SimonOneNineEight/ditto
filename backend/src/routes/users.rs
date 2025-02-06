use axum::{routing::post, Router};

use crate::handler::users::{login, register_user};

pub fn routes() -> Router {
    Router::new()
        .route("/users", post(register_user))
        .route("/login", post(login))
}
