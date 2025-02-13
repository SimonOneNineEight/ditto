use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    handler::users::{get_me, login, logout, refresh_token, register_user},
    utils::state::AppState,
};

pub fn routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/users", post(register_user))
        .route("/login", post(login))
        .route("/refresh_token", post(refresh_token))
        .route("/logout", post(logout))
        .route("/me", get(get_me))
        .with_state(app_state)
}
