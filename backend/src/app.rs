use std::sync::Arc;

use axum::{
    http::header::{AUTHORIZATION, CONTENT_TYPE},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::{openapi::ApiDoc, routes, utils::state::AppState};

pub fn create_app(app_state: Arc<AppState>) -> Router {
    Router::new()
        .merge(routes::register_routes(app_state.clone()))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_headers([CONTENT_TYPE, AUTHORIZATION])
                .allow_methods(Any),
        )
}
