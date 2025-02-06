use axum::{Extension, Json};
use hyper::StatusCode;
use sqlx::PgPool;
use validator::Validate;

use crate::{
    auth::{
        hashing::{hash_password, verify_password},
        jwt::generate_token,
    },
    db::users::{email_exists, get_user_by_email, insert_user},
    error::{app_error::AppError, user_error::UserError},
    models::users::{LoginRequest, LoginResponse, NewUser, PublicUser, RegisterUserRequest},
    utils::response::ApiResponse,
};

pub async fn register_user(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<RegisterUserRequest>,
) -> Result<ApiResponse<PublicUser>, AppError> {
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

    Ok(ApiResponse::success(
        StatusCode::CREATED,
        PublicUser {
            id: user.id,
            name: user.name,
            email: user.email,
            auth_provider: user.auth_provider,
            auth_provider_id: user.auth_provider_id,
            avatar_url: user.avatar_url,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
    ))
}

pub async fn login(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> Result<ApiResponse<LoginResponse>, AppError> {
    payload.validate().map_err(UserError::from)?;

    let user = get_user_by_email(&pool, &payload.email)
        .await?
        .ok_or(UserError::InvalidCredentials)?;

    let password_hash = user
        .password_hash
        .as_deref()
        .ok_or(UserError::InvalidCredentials)?;

    if !verify_password(&payload.password, password_hash)? {
        tracing::warn!("Failed login attempt for email: {}", payload.email);
        return Err(UserError::InvalidCredentials.into());
    }

    tracing::info!("User {} logged in successfully", user.email);

    let access_token = generate_token(user.id, "access", 15 * 60)?;
    let refresh_token = generate_token(user.id, "refresh", 7 * 24 * 60 * 60)?;

    Ok(ApiResponse::success(
        StatusCode::OK,
        LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
        },
    ))
}
