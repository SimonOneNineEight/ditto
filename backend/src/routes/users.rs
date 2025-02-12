use std::sync::Arc;

use axum::{routing::post, Router};

use crate::{
    handler::users::{login, logout, refresh_token, register_user},
    utils::state::AppState,
};

pub fn routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/users", post(register_user))
        .route("/login", post(login))
        .route("/refresh_token", post(refresh_token))
        .route("/logout", post(logout))
        .with_state(app_state)
}
