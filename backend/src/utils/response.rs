use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct ApiResponse<T>
where
    T: Serialize + ToSchema,
{
    success: bool,
    status_code: u16,

    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,

    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

impl<T: Serialize + ToSchema> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        let status_code =
            StatusCode::from_u16(self.status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

        (status_code, Json(self)).into_response()
    }
}

impl<T: Serialize + ToSchema> ApiResponse<T> {
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

#[derive(Serialize, ToSchema)]
pub struct EmptyResponse {}
