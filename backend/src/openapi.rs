use utoipa::{
    openapi::security::{ApiKey, ApiKeyValue, SecurityScheme},
    Modify, OpenApi,
};

use crate::{
    models::users::{
        LoginRequest, LoginResponse, PublicUser, RefreshTokenRequest, RegisterUserRequest,
    },
    utils::response::{ApiResponse, EmptyResponse},
};

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::handler::users::register_user,
        crate::handler::users::login,
        crate::handler::users::refresh_token,
        crate::handler::users::logout,
        crate::handler::users::get_me,
    ),
    components(
        schemas(
            RegisterUserRequest,
            LoginRequest,
            RefreshTokenRequest,
            PublicUser,
            LoginResponse,
            EmptyResponse,
            ApiResponse<LoginResponse>,
            ApiResponse<PublicUser>,
            ApiResponse<EmptyResponse>,
        ),
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "auth", description = "Authentication endpoints"),
        (name = "users", description = "User management endpoints"),
    ),
    info(
        title = "Axum API",
        version = "0.1.0",
        description = "Axum API documentation",
    )
)]
pub struct ApiDoc;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.as_mut().unwrap();
        components.add_security_scheme(
            "bearer",
            SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new("Authorization"))),
        );
    }
}
