use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserAuth {
    pub id: Uuid,
    pub user_id: Uuid,

    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub auth_provider: String,
    pub avatar_url: Option<String>,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewUser {
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub auth_provider: String,
    pub auth_provider_id: Option<String>,
    pub avatar_url: Option<String>,
    pub roles: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRole {
    pub id: Uuid,
    pub role_id: Uuid,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PublicUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub auth_provider: String,
    pub avatar_url: Option<String>,
    pub roles: Vec<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

const MIN_PASSWORD_LENGTH: u64 = 8;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct RegisterUserRequest {
    pub name: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 8 characters long"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct LoginRequest {
    #[validate(email)]
    #[schema(example = "user@example.com")]
    pub email: String,

    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 8 characters long"))]
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct RoleId {
    pub id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserWithAuth {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub auth_provider: String,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_at: Option<NaiveDateTime>,
}
