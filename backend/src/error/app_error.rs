use anyhow::Error as AnyhowError;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use sqlx::Error as SqlxError;

use super::user_error::UserError;
use crate::utils::response::ApiResponse;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Conflict(String),
    InternalServerError,
    Unexpected(String),
    DatabaseError(String),
    UserError(UserError),
}

impl From<SqlxError> for AppError {
    fn from(err: SqlxError) -> Self {
        tracing::error!("Database error: {:?}", err);
        match err {
            SqlxError::RowNotFound => AppError::NotFound("Database record not found".into()),
            _ => AppError::DatabaseError("Database error occurred!".into()),
        }
    }
}

impl From<AnyhowError> for AppError {
    fn from(err: AnyhowError) -> Self {
        tracing::error!("Unexpected error: {:?}", err);
        AppError::Unexpected("Internal Server Error!".to_string())
    }
}

impl From<UserError> for AppError {
    fn from(err: UserError) -> Self {
        AppError::UserError(err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::InternalServerError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error".to_string(),
            ),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::Unexpected(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::UserError(user_error) => return user_error.into_response(),
        };

        ApiResponse::<()>::error(status, error_message).into_response()
    }
}
