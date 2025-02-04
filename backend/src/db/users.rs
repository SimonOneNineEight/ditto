use chrono::NaiveDateTime;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::users::{NewUser, User};

pub async fn insert_user(pool: &PgPool, new_user: NewUser) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, name, email, password_hash, auth_provider , auth_provider_id, avatar_url, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING 
            id as "id: Uuid",
            name,
            email,
            password_hash,
            auth_provider,
            auth_provider_id,
            avatar_url,
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
