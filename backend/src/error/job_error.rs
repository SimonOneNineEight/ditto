use axum::response::{IntoResponse, Response};
use hyper::StatusCode;

use crate::utils::response::ApiResponse;

#[derive(Debug)]
pub enum JobError {
    JobSourceTypeNotExist(String),
}

impl IntoResponse for JobError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            JobError::JobSourceTypeNotExist(error) => (StatusCode::BAD_REQUEST, error.to_string()),
        };
        ApiResponse::<()>::error(status, message).into_response()
    }
}
