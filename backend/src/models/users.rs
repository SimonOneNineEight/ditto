use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,

    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub auth_provider: String,
    pub auth_provider_id: Option<String>,
    pub avatar_url: Option<String>,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_at: Option<NaiveDateTime>,
    pub role: String,

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
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub auth_provider: String,
    pub auth_provider_id: Option<String>,
    pub avatar_url: Option<String>,
    pub role: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

const MIN_PASSWORD_LENGTH: u64 = 8;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterUserRequest {
    pub name: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 8 characters long"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,

    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 8 characters long"))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}
