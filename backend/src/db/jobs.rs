use chrono::NaiveDateTime;
use sqlx::{types::BigDecimal, PgPool};
use uuid::Uuid;

use crate::{
    error::app_error::AppError,
    models::jobs::{Job, ManualJobInput, NewJob},
};

pub async fn get_jobs(pool: &PgPool) -> Result<Vec<Job>, AppError> {
    let jobs = sqlx::query_as!(
        Job,
        r#"
            SELECT 
                j.id AS "id!: Uuid",
                j.title, 
                j.company_id AS "company_id!: Uuid",
                c.name as company,
                j.location,
                j.job_posting_id,
                j.job_url,
                j.job_description,
                j.job_type,
                j.min_salary AS "min_salary: BigDecimal",
                j.max_salary AS "max_salary: BigDecimal",
                j.currency,
                j.job_source,
                j.is_expired, 
                j.scraped_at AS "scraped_at: NaiveDateTime",
                j.created_at AS "created_at: NaiveDateTime",
                j.updated_at AS "updated_at: NaiveDateTime"
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            ORDER BY j.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(jobs)
}

pub async fn create_job(pool: &PgPool, new_job: NewJob) -> Result<Job, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let company_id = sqlx::query_scalar!(
        r#"
            INSERT INTO companies (id, name)
            VALUES (COALESCE((SELECT id FROM companies WHERE name = $1), $2), $1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        "#,
        new_job.company,
        Uuid::new_v4()
    )
    .fetch_one(&mut *tx)
    .await?;

    let manual_job = sqlx::query_as!(
        ManualJobInput,
        r#"
            INSERT INTO jobs (
                id,
                title,
                company_id,
                location,
                job_description,
                job_url,
                job_type,
                min_salary,
                max_salary,
                currency,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW() 
            )
            RETURNING 
                id AS "id!: Uuid",
                title, 
                company_id AS "company_id!: Uuid",
                location,
                job_description,
                job_url,
                job_type,
                min_salary AS "min_salary: BigDecimal",
                max_salary AS "max_salary: BigDecimal",
                currency,
                created_at AS "created_at: NaiveDateTime",
                updated_at AS "updated_at: NaiveDateTime"
        "#,
        Uuid::new_v4(),
        new_job.title,
        company_id,
        new_job.location,
        new_job.job_description,
        new_job.job_posting_url,
        new_job.job_type,
        new_job.min_salary,
        new_job.max_salary,
        new_job.currency,
    )
    .fetch_one(&mut *tx)
    .await?;

    Ok(manual_job.into_job(new_job.company))
}
