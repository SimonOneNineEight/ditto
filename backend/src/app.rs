use std::sync::Arc;

use axum::{
    http::header::{AUTHORIZATION, CONTENT_TYPE},
    response::IntoResponse,
    routing::MethodRouter,
    Router,
};
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

    // let options_route = MethodRouter::new().options(|| async { ().into_response() });

    Router::new()
        // .route("/{*path}", options_route)
        .merge(routes::register_routes(app_state.clone()))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_headers([CONTENT_TYPE, AUTHORIZATION])
                .allow_methods(Any),
        )
    // .layer(GovernorLayer { config })
}
