use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use validator::ValidationErrors;

use crate::utils::response::ApiResponse;

#[derive(Debug)]
pub enum UserError {
    InvalidCredentials,
    EmailAlreadyExists,
    Unauthorized,
    ValidationError(ValidationErrors),
    RoleNotFound,
}

impl From<ValidationErrors> for UserError {
    fn from(err: ValidationErrors) -> Self {
        tracing::error!("Validation error: {:?}", err);
        UserError::ValidationError(err)
    }
}

impl IntoResponse for UserError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            UserError::InvalidCredentials => {
                (StatusCode::UNAUTHORIZED, "Invalid credentials".to_string())
            }
            UserError::EmailAlreadyExists => {
                (StatusCode::CONFLICT, "Email already registered".to_string())
            }
            UserError::ValidationError(errors) => (StatusCode::BAD_REQUEST, errors.to_string()),
            UserError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            UserError::RoleNotFound => (StatusCode::BAD_REQUEST, "Role not found".to_string()),
        };

        ApiResponse::<()>::error(status, message).into_response()
    }
}
