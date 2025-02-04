use axum::Router;
use tower_http::cors::{Any, CorsLayer};

use backend::routes;

pub fn create_app() -> Router {
    Router::new()
        .merge(routes::register_routes())
        .layer(CorsLayer::new().allow_origin(Any))
}
