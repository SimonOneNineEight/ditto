use axum::{http::StatusCode, Extension, Json};
use sqlx::PgPool;
use validator::Validate;

use crate::{
    auth::hashing::hash_password,
    db::users::{email_exists, insert_user},
    error::{app_error::AppError, user_error::UserError},
    models::users::{NewUser, PublicUser, RegisterUserRequest},
};

pub async fn register_user(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<RegisterUserRequest>,
) -> Result<Json<PublicUser>, AppError> {
    payload.validate().map_err(UserError::from)?;

    if email_exists(&pool, &payload.email).await? {
        return Err(UserError::EmailAlreadyExists.into());
    }

    let password_hash =
        hash_password(&payload.password).map_err(|_| UserError::InvalidCredentials)?;

    let new_user = NewUser {
        name: payload.name,
        email: payload.email,
        password_hash,
        auth_provider: "email".to_string(),
        auth_provider_id: None,
        avatar_url: None,
        role: "user".to_string(),
    };

    let user = insert_user(&pool, new_user).await?;

    Ok(Json(PublicUser {
        id: user.id,
        name: user.name,
        email: user.email,
        auth_provider: user.auth_provider,
        auth_provider_id: user.auth_provider_id,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }))
}
