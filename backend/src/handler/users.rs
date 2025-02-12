use std::sync::Arc;

use axum::{extract::State, Json};
use hyper::StatusCode;
use validator::Validate;

use crate::{
    auth::{
        extractor::AuthenticatedUser,
        hashing::{hash_password, verify_password},
        jwt::{generate_token, validate_token},
    },
    db::users::{
        email_exists, get_user_by_email, get_user_by_refresh_token, insert_user,
        invalidate_refresh_token, store_refresh_token,
    },
    error::{app_error::AppError, user_error::UserError},
    models::users::{
        LoginRequest, LoginResponse, NewUser, PublicUser, RefreshTokenRequest, RegisterUserRequest,
    },
    utils::{
        response::{ApiResponse, EmptyResponse},
        state::AppState,
    },
};

pub async fn register_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterUserRequest>,
) -> Result<ApiResponse<PublicUser>, AppError> {
    payload.validate().map_err(UserError::from)?;

    if email_exists(&state.db, &payload.email).await? {
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

    let user = insert_user(&state.db, new_user).await?;

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
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<ApiResponse<LoginResponse>, AppError> {
    payload.validate().map_err(UserError::from)?;

    let user = get_user_by_email(&state.db, &payload.email)
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

    let access_token = generate_token(user.id, "access")?;
    let refresh_token = generate_token(user.id, "refresh")?;

    Ok(ApiResponse::success(
        StatusCode::OK,
        LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
        },
    ))
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    AuthenticatedUser { user_id }: AuthenticatedUser,
) -> Result<ApiResponse<EmptyResponse>, AppError> {
    invalidate_refresh_token(&state.db, user_id).await?;
    Ok(ApiResponse::success(StatusCode::OK, EmptyResponse {}))
}

pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<ApiResponse<LoginResponse>, AppError> {
    let claims = validate_token(&payload.refresh_token)?;

    if claims.token_type != "refresh" {
        return Err(UserError::Unauthorized.into());
    }

    let user_id = get_user_by_refresh_token(&state.db, &payload.refresh_token)
        .await?
        .ok_or(UserError::Unauthorized)?;

    let new_access_token = generate_token(user_id, "access")?;
    let new_refresh_token = generate_token(user_id, "refresh")?;

    store_refresh_token(&state.db, &user_id, &payload.refresh_token).await?;

    Ok(ApiResponse::success(
        StatusCode::OK,
        LoginResponse {
            access_token: new_access_token,
            refresh_token: new_refresh_token,
            token_type: "Bearerd".to_string(),
        },
    ))
}
