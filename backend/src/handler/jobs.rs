use std::sync::Arc;

use axum::{
    extract::{Path, State},
    Json,
};
use hyper::StatusCode;
use uuid::Uuid;

use crate::{
    auth::extractor::AuthenticatedUser,
    db,
    error::app_error::AppError,
    models::jobs::{Job, NewJob, PatchJobRequest, UpdateJobRequest},
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

#[utoipa::path(
    put,
    path = "/api/jobs/{job_id}",
    responses(
        (status = 200, description = "Job updated successfully", body = ApiResponse<Job>),
        (status = 400, description = "Invalid request data", body = ApiResponse<EmptyResponse>),
        (status = 403, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 404, description = "Job not found", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "jobs"
)]
pub async fn update_job(
    Path(job_id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
    _: AuthenticatedUser,
    Json(payload): Json<UpdateJobRequest>,
) -> Result<ApiResponse<Job>, AppError> {
    let job = db::jobs::update_job(&state.db, job_id, payload).await?;

    tracing::info!("Job {} updated successfully", job_id);

    Ok(ApiResponse::success(StatusCode::OK, job))
}

#[utoipa::path(
    patch,
    path = "/api/jobs/{job_id}",
    responses(
        (status = 200, description = "Job updated successfully", body = ApiResponse<Job>),
        (status = 400, description = "Invalid request data", body = ApiResponse<EmptyResponse>),
        (status = 403, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 404, description = "Job not found", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
)]
pub async fn patch_job(
    Path(job_id): Path<Uuid>,
    State(state): State<Arc<AppState>>,
    _: AuthenticatedUser,
    Json(payload): Json<PatchJobRequest>,
) -> Result<ApiResponse<Job>, AppError> {
    let job = db::jobs::patch_job(&state.db, job_id, payload).await?;

    tracing::info!("Job {} updated successfully", job_id);

    Ok(ApiResponse::success(StatusCode::OK, job))
}

#[utoipa::path(
    delete,
    path = "/api/jobs/{job_id}",
    responses(
        (status = 200, description = "Job deleted successfully", body = ApiResponse<EmptyResponse>),
        (status = 403, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 404, description = "Job not found", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "jobs"
)]
pub async fn delete_job(
    State(state): State<Arc<AppState>>,
    _: AuthenticatedUser,
    Path(job_id): Path<Uuid>,
) -> Result<ApiResponse<EmptyResponse>, AppError> {
    db::jobs::soft_delete_job(&state.db, job_id).await?;

    tracing::info!("Job {} deleted successfully", job_id);

    Ok(ApiResponse::success(StatusCode::OK, EmptyResponse {}))
}
