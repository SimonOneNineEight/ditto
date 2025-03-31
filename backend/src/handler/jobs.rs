use std::sync::Arc;

use axum::{extract::State, Json};
use hyper::StatusCode;

use crate::{
    auth::extractor::AuthenticatedUser,
    db,
    error::app_error::AppError,
    models::jobs::{Job, NewJob},
    utils::{
        response::{ApiResponse, EmptyResponse},
        state::AppState,
    },
};

#[utoipa::path(
    get,
    path = "/api/jobs",
    responses(
        (status = 200, description = "Fetch job list success", body = ApiResponse<Vec<Job>>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "jobs"
)]
pub async fn get_jobs(
    State(state): State<Arc<AppState>>,
) -> Result<ApiResponse<Vec<Job>>, AppError> {
    let jobs: Vec<Job> = db::jobs::get_jobs(&state.db).await?;

    Ok(ApiResponse::success(StatusCode::OK, jobs))
}

#[utoipa::path(
    post,
    path = "/api/jobs",
    responses(
        (status = 201, description = "Job created successfully", body = ApiResponse<Job>),
        (status = 400, description = "Invalid request data", body = ApiResponse<EmptyResponse>),
        (status = 403, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "jobs"
)]
pub async fn create_job(
    State(state): State<Arc<AppState>>,
    _: AuthenticatedUser,
    Json(payload): Json<NewJob>,
) -> Result<ApiResponse<Job>, AppError> {
    let job = db::jobs::create_job(&state.db, payload).await?;

    tracing::info!("Job {}, {} created successfully", job.company, job.title);

    Ok(ApiResponse::success(StatusCode::OK, job))
}
