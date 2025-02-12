use std::sync::Arc;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};

use crate::{routes, utils::state::AppState};

pub fn create_app(app_state: Arc<AppState>) -> Router {
    Router::new()
        .merge(routes::register_routes(app_state.clone()))
        .layer(CorsLayer::new().allow_origin(Any))
}
