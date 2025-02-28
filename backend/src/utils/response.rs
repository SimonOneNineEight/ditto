use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T> {
    success: bool,
    status_code: u16,
    data: Option<T>,
    error: Option<String>,
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        let status_code =
            StatusCode::from_u16(self.status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

        (status_code, Json(self)).into_response()
    }
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(status_code: StatusCode, data: T) -> Self {
        ApiResponse {
            success: true,
            status_code: status_code.as_u16(),
            data: Some(data),
            error: None,
        }
    }

    pub fn error(status_code: StatusCode, error_message: String) -> Self {
        ApiResponse {
            success: false,
            status_code: status_code.as_u16(),
            data: None,
            error: Some(error_message),
        }
    }
}

#[derive(Serialize)]
pub struct EmptyResponse {}
