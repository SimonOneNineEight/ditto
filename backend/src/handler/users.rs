use std::sync::Arc;

use axum::{extract::State, Json};
use hyper::StatusCode;
use utoipa;
use validator::Validate;

use crate::{
    auth::{
        extractor::AuthenticatedUser,
        hashing::{hash_password, verify_password},
        jwt::{generate_token, validate_token},
    },
    db::users::{
        email_exists, get_user_by_id, get_user_by_refresh_token, get_user_with_auth_by_email,
        insert_user, invalidate_refresh_token, store_refresh_token,
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

#[utoipa::path(post, path = "/api/users", request_body = RegisterUserRequest, responses(
    (status = 201, description = "User created successfully", body = ApiResponse<LoginResponse>),
    (status = 400, description = "Invalid request data", body = ApiResponse<EmptyResponse>),
    (status = 409, description = "Email already exists", body = ApiResponse<EmptyResponse>),
    (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
), tag = "auth"
)]
pub async fn register_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterUserRequest>,
) -> Result<ApiResponse<LoginResponse>, AppError> {
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
        roles: vec!["user".to_string()],
    };

    let user = insert_user(&state.db, new_user).await?;

    tracing::info!("User {} created successfully", user.email);

    let access_token = generate_token(user.id, "access")?;
    let refresh_token = generate_token(user.id, "refresh")?;

    store_refresh_token(&state.db, &user.id, &refresh_token).await?;

    Ok(ApiResponse::success(
        StatusCode::CREATED,
        LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
        },
    ))
}

#[utoipa::path(
    post,
    path = "/api/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = ApiResponse<LoginResponse>),
        (status = 400, description = "Invalid request data", body = ApiResponse<EmptyResponse>),
        (status = 401, description = "Invalid credentials", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "auth"
)]
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<ApiResponse<LoginResponse>, AppError> {
    payload.validate().map_err(UserError::from)?;

    let user = get_user_with_auth_by_email(&state.db, &payload.email)
        .await?
        .ok_or(UserError::InvalidCredentials)?;

    if !verify_password(&payload.password, &user.password_hash)? {
        tracing::warn!("Failed login attempt for email: {}", payload.email);
        return Err(UserError::InvalidCredentials.into());
    }

    tracing::info!("User {} logged in successfully", user.email);

    let access_token = generate_token(user.id, "access")?;
    let refresh_token = generate_token(user.id, "refresh")?;

    store_refresh_token(&state.db, &user.id, &refresh_token).await?;

    Ok(ApiResponse::success(
        StatusCode::OK,
        LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
        },
    ))
}

#[utoipa::path(
    post,
    path = "/api/logout",
    responses(
        (status = 200, description = "Logout successful", body = ApiResponse<EmptyResponse>),
        (status = 401, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    security(
        ("bearer" = [])
    ),
    tag = "auth"
)]
pub async fn logout(
    State(state): State<Arc<AppState>>,
    AuthenticatedUser { user_id }: AuthenticatedUser,
) -> Result<ApiResponse<EmptyResponse>, AppError> {
    invalidate_refresh_token(&state.db, user_id).await?;
    Ok(ApiResponse::success(StatusCode::OK, EmptyResponse {}))
}

#[utoipa::path(
    post,
    path = "/api/refresh_token",
    request_body = RefreshTokenRequest,
    responses(
        (status = 200, description = "Token refreshed successfully", body = ApiResponse<LoginResponse>),
        (status = 401, description = "Invalid refresh token", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    tag = "auth"
)]
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

    store_refresh_token(&state.db, &user_id, &new_refresh_token).await?;

    Ok(ApiResponse::success(
        StatusCode::OK,
        LoginResponse {
            access_token: new_access_token,
            refresh_token: new_refresh_token,
            token_type: "Bearer".to_string(),
        },
    ))
}

#[utoipa::path(
    get,
    path = "/api/me",
    responses(
        (status = 200, description = "User profile retrieved successfully", body = ApiResponse<PublicUser>),
        (status = 401, description = "Unauthorized", body = ApiResponse<EmptyResponse>),
        (status = 404, description = "User not found", body = ApiResponse<EmptyResponse>),
        (status = 500, description = "Internal server error", body = ApiResponse<EmptyResponse>)
    ),
    security(
        ("bearer" = [])
    ),
    tag = "users"
)]
pub async fn get_me(
    State(state): State<Arc<AppState>>,
    AuthenticatedUser { user_id }: AuthenticatedUser,
) -> Result<ApiResponse<PublicUser>, AppError> {
    let user = get_user_by_id(&state.db, user_id)
        .await?
        .ok_or(AppError::NotFound(format!(
            "User id {} not found!",
            user_id
        )))?;

    Ok(ApiResponse::success(StatusCode::OK, user))
}
