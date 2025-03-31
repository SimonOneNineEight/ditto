use chrono::{Duration, NaiveDateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::{app_error::AppError, user_error::UserError},
    models::users::{NewUser, PublicUser, RoleId, User, UserAuth, UserWithAuth},
};

pub async fn insert_user(pool: &PgPool, new_user: NewUser) -> Result<User, AppError> {
    let mut tx = pool.begin().await?;

    println!("Creating user, {:?}", new_user);

    let user_id = Uuid::new_v4();

    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, name, email, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING 
            id as "id: Uuid",
            name,
            email,
            created_at as "created_at: NaiveDateTime",
            updated_at as "updated_at: NaiveDateTime"
        "#,
        user_id,
        new_user.name,
        new_user.email,
    )
    .fetch_one(&mut *tx)
    .await?;

    println!("User created successfully: {:?}", user);

    tracing::info!("User created successfully");

    sqlx::query_as!(
        UserAuth,
        r#"
        INSERT INTO users_auth (
            id, user_id, password_hash, auth_provider, avatar_url, refresh_token, refresh_token_expires_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, NULL, NOW(), NOW())
        RETURNING 
            id as "id!: Uuid",
            user_id as "user_id!: Uuid",
            password_hash,
            auth_provider,
            avatar_url,
            refresh_token,
            refresh_token_expires_at as "refresh_token_expires_at: NaiveDateTime",
            created_at as "created_at: NaiveDateTime",
            updated_at as "updated_at: NaiveDateTime"
        "#,
        Uuid::new_v4(),
        user_id,
        new_user.password_hash,
        new_user.auth_provider,
        new_user.avatar_url
    )
    .fetch_one(&mut *tx)
    .await?;

    tracing::info!("User auth created successfully");

    let mut role_ids = Vec::new();

    for role in new_user.roles {
        let role_id = sqlx::query_as!(
            RoleId,
            r#"
                SELECT id FROM roles WHERE name = $1
            "#,
            role
        )
        .fetch_optional(&mut *tx)
        .await?;

        match role_id {
            Some(role_id) => {
                role_ids.push(role_id.id);
            }
            None => {
                return Err(UserError::RoleNotFound.into());
            }
        }
    }

    for role_id in role_ids {
        sqlx::query!(
            r#"
                INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
            "#,
            user_id,
            role_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tracing::info!("User created successfully");

    tx.commit().await?;

    println!("User {} created successfully", user.email);

    Ok(user)
}

pub async fn email_exists(pool: &PgPool, email: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query_scalar!("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", email)
        .fetch_one(pool)
        .await?;

    Ok(result.unwrap_or(false))
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, name, email,created_at, updated_at FROM users WHERE email = $1",
        email
    )
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn get_user_with_auth_by_email(
    pool: &PgPool,
    email: &str,
) -> Result<Option<UserWithAuth>, sqlx::Error> {
    let user = sqlx::query_as!(
        UserWithAuth,
        r#"
        SELECT 
            u.id,
            u.name,
            u.email,
            a.password_hash,
            a.auth_provider,
            a.refresh_token,
            a.refresh_token_expires_at as "refresh_token_expires_at: NaiveDateTime"
        FROM 
            users_auth a
        JOIN 
            users u ON a.user_id = u.id
        WHERE 
            u.email = $1
        "#,
        email
    )
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn invalidate_refresh_token(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users_auth SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE user_id = $1",
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
        "SELECT user_id FROM users_auth WHERE refresh_token = $1 AND refresh_token_expires_at > NOW()",
        refresh_token
    )
    .fetch_optional(pool)
    .await?;

    Ok(record.and_then(|r| r.user_id))
}

pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<PublicUser>, sqlx::Error> {
    let user = sqlx::query_as!(
        PublicUser,
        r#"
        SELECT u.id, u.email, u.name, a.auth_provider, a.avatar_url, u.created_at, u.updated_at, ARRAY_AGG(ro.name) as "roles!: Vec<String>"
        FROM users u
        JOIN users_auth a ON u.id = a.user_id
        LEFT JOIN user_roles r ON u.id = r.user_id
        LEFT JOIN roles ro ON r.role_id = ro.id
        WHERE u.id = $1
        GROUP BY u.id, u.email, u.name, a.auth_provider, a.avatar_url, u.created_at, u.updated_at
        "#,
        id
    )
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn store_refresh_token(
    pool: &PgPool,
    user_id: &Uuid,
    refresh_token: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users_auth SET refresh_token = $1, refresh_token_expires_at = $2 WHERE user_id = $3",
        refresh_token,
        Utc::now().naive_utc() + Duration::days(7),
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
