use sqlx::PgConnection;
use uuid::Uuid;

use crate::error::app_error::AppError;

pub async fn upsert_company(pool: &mut PgConnection, company: &str) -> Result<Uuid, AppError> {
    let company_id = sqlx::query_scalar!(
        r#"
            INSERT INTO companies (id, name)
            VALUES (COALESCE((SELECT id FROM companies WHERE name = $1), $2), $1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        "#,
        company,
        Uuid::new_v4()
    )
    .fetch_one(pool)
    .await?;

    Ok(company_id)
}
