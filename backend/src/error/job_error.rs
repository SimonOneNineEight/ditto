use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::utils::response::ApiResponse;

#[derive(Debug)]
pub enum JobError {}

impl IntoResponse for JobError {
    fn into_response(self) -> Response {
        let (status, message) = match self {};

        ApiResponse::<()>::error(status, message).into_response()
    }
}
