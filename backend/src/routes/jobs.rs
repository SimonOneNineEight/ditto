use std::sync::Arc;

use axum::{
    routing::{delete, get, patch, post, put},
    Router,
};

use crate::{
    handler::jobs::{create_job, delete_job, get_jobs, patch_job, update_job},
    utils::state::AppState,
};

pub fn routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/jobs", get(get_jobs))
        .route("/jobs", post(create_job))
        .route("/jobs/:job_id", put(update_job))
        .route("/jobs/:job_id", patch(patch_job))
        .route("/jobs/:job_id", delete(delete_job))
        .with_state(app_state)
}
