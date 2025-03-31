use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    handler::jobs::{create_job, get_jobs},
    utils::state::AppState,
};

pub fn routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/jobs", get(get_jobs))
        .route("/jobs", post(create_job))
        .with_state(app_state)
}
