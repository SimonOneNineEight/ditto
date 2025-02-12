use chrono::{Duration, NaiveDateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::users::{NewUser, User};

pub async fn insert_user(pool: &PgPool, new_user: NewUser) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, name, email, password_hash, auth_provider , auth_provider_id, avatar_url, refresh_token, refresh_token_expires_at, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, $8, NOW(), NOW())
        RETURNING 
            id as "id: Uuid",
            name,
            email,
            password_hash,
            auth_provider,
            auth_provider_id,
            avatar_url,
            refresh_token,
            refresh_token_expires_at,
            role,
            created_at as "created_at: NaiveDateTime",
            updated_at as "updated_at: NaiveDateTime"
        "#,
        Uuid::new_v4(),
        new_user.name,
        new_user.email,
        new_user.password_hash,
        new_user.auth_provider,
        new_user.auth_provider_id,
        new_user.avatar_url,
        new_user.role
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn email_exists(pool: &PgPool, email: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query_scalar!("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email)
        .fetch_one(pool)
        .await?;

    Ok(result.unwrap_or(false))
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as!(User, "SELECT id, name, email, password_hash, auth_provider, auth_provider_id, avatar_url, role, refresh_token, refresh_token_expires_at, created_at, updated_at FROM users WHERE email = $1", email)
        .fetch_optional(pool)
        .await?;

    Ok(user)
}

pub async fn invalidate_refresh_token(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = $1",
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_user_by_refresh_token(
    pool: &PgPool,
    refresh_token: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let record = sqlx::query!(
        "SELECT id FROM users WHERE refresh_token = $1 AND refresh_token_expires_at > NOW()",
        refresh_token
    )
    .fetch_optional(pool)
    .await?;

    Ok(record.map(|r| r.id))
}

pub async fn store_refresh_token(
    pool: &PgPool,
    user_id: &Uuid,
    refresh_token: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3",
        refresh_token,
        Utc::now().naive_utc() + Duration::days(7),
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
