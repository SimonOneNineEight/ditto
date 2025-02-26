use std::sync::Arc;

use axum::Router;
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};
use tower_http::cors::{Any, CorsLayer};

use crate::{routes, utils::state::AppState};

pub fn create_app(app_state: Arc<AppState>) -> Router {
    let config = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(5)
            .burst_size(10)
            .finish()
            .unwrap(),
    );
    Router::new()
        .layer(GovernorLayer { config })
        .layer(CorsLayer::new().allow_origin(Any))
        .merge(routes::register_routes(app_state.clone()))
}
