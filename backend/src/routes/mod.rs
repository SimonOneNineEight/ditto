use std::sync::Arc;

use axum::Router;

use crate::utils::state::AppState;

pub mod health;
pub mod jobs;
pub mod users;

pub fn register_routes(app_state: Arc<AppState>) -> Router {
    Router::new().nest(
        "/api",
        Router::new()
            .merge(health::routes())
            .merge(users::routes(app_state.clone()))
            .merge(jobs::routes(app_state.clone())),
    )
}
