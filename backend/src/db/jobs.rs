use chrono::NaiveDateTime;
use sqlx::{types::BigDecimal, PgPool};
use uuid::Uuid;

use crate::{
    error::app_error::AppError,
    models::jobs::{Job, ManualJobInput, NewJob, PatchJobRequest, UpdateJobRequest},
};

use super::companies::upsert_company;

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
                j.updated_at AS "updated_at: NaiveDateTime",
                j.deleted_at AS "deleted_at: NaiveDateTime"
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.deleted_at IS NULL
            ORDER BY j.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(jobs)
}

pub async fn get_job_by_id(pool: &PgPool, job_id: Uuid) -> Result<Option<Job>, AppError> {
    let job = sqlx::query_as!(
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
                j.updated_at AS "updated_at: NaiveDateTime",
                j.deleted_at AS "deleted_at: NaiveDateTime"
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.deleted_at IS NULL
            AND j.id = $1
            ORDER BY j.created_at DESC
        "#,
        job_id
    )
    .fetch_optional(pool)
    .await?;

    Ok(job)
}

pub async fn create_job(pool: &PgPool, new_job: NewJob) -> Result<Job, AppError> {
    let mut tx = pool.begin().await?;

    let company_id = upsert_company(&mut tx, &new_job.company).await?;

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

pub async fn update_job(
    pool: &PgPool,
    job_id: Uuid,
    updated_job: UpdateJobRequest,
) -> Result<Job, AppError> {
    let mut tx = pool.begin().await?;

    let company_id: Uuid = upsert_company(&mut tx, &updated_job.company).await?;

    let job = sqlx::query_as!(
        Job,
        r#"
            UPDATE jobs
            SET
                title = $2,
                company_id = $3,
                location = $4,
                job_description = $5,
                job_posting_id = $6,
                job_url = $7,
                job_type = $8,
                min_salary = $9,
                max_salary = $10,
                currency = $11,
                job_source = $12,
                is_expired = $13,
                scraped_at = $14
            WHERE id = $1
            RETURNING 
                id AS "id!: Uuid",
                title AS "title!: String", 
                company_id AS "company_id!: Uuid",
                COALESCE((SELECT name FROM companies WHERE id = company_id), '') AS "company!: String",
                location AS "location!: String",
                job_description AS "job_description!: String",
                job_type AS "job_type!: String",
                job_posting_id AS "job_posting_id?: String",
                job_url AS "job_url?: String",
                job_source AS "job_source?: String",
                min_salary AS "min_salary?: BigDecimal",
                max_salary AS "max_salary?: BigDecimal",
                currency AS "currency?: String",
                is_expired AS "is_expired!: bool", 
                scraped_at AS "scraped_at?: NaiveDateTime",
                created_at AS "created_at!: NaiveDateTime",
                updated_at AS "updated_at!: NaiveDateTime",
                deleted_at AS "deleted_at?: NaiveDateTime"
        "#,
        job_id,
        updated_job.title,
        company_id,
        updated_job.location,
        updated_job.job_description,
        updated_job.job_posting_id,
        updated_job.job_url,
        updated_job.job_type,
        updated_job.min_salary,
        updated_job.max_salary,
        updated_job.currency,
        updated_job.job_source,
        updated_job.is_expired,
        updated_job.scraped_at,
    )
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(job)
}

pub async fn patch_job(
    pool: &PgPool,
    job_id: Uuid,
    patch_job: PatchJobRequest,
) -> Result<Job, AppError> {
    let mut query_builder = sqlx::QueryBuilder::new("UPDATE jobs SET ");
    let mut separated = query_builder.separated(", ");
    let mut tx = pool.begin().await?;

    let mut company_id: Option<Uuid> = None;
    if let Some(company_name) = patch_job.company {
        let id = upsert_company(&mut tx, &company_name).await?;
        company_id = Some(id);
    } else if let Some(id) = patch_job.company_id {
        company_id = Some(id);
    }

    if let Some(id) = company_id {
        separated.push("company_id = ");
        separated.push_bind(id);
    }

    if let Some(title) = patch_job.title {
        separated.push("title = ");
        separated.push_bind(title);
    }

    if let Some(location) = patch_job.location {
        separated.push("location = ");
        separated.push_bind(location);
    }
    if let Some(job_description) = patch_job.job_description {
        separated.push("job_description = ");
        separated.push_bind(job_description);
    }

    if let Some(job_type) = patch_job.job_type {
        separated.push("job_type = ");
        separated.push_bind(job_type);
    }

    if let Some(is_expired) = patch_job.is_expired {
        separated.push("is_expired = ");
        separated.push_bind(is_expired);
    }

    if let Some(job_posting_id) = patch_job.job_posting_id {
        separated.push("job_posting_id = ");
        separated.push_bind(job_posting_id);
    }

    if let Some(job_url) = patch_job.job_url {
        separated.push("job_url = ");
        separated.push_bind(job_url);
    }

    if let Some(min_salary) = patch_job.min_salary {
        separated.push("min_salary = ");
        separated.push_bind(min_salary);
    }

    if let Some(max_salary) = patch_job.max_salary {
        separated.push("max_salary = ");
        separated.push_bind(max_salary);
    }

    if let Some(currency) = patch_job.currency {
        separated.push("currency = ");
        separated.push_bind(currency);
    }

    if let Some(job_source) = patch_job.job_source {
        separated.push("job_source = ");
        separated.push_bind(job_source);
    }

    if let Some(scraped_at) = patch_job.scraped_at {
        separated.push("scraped_at = ");
        separated.push_bind(scraped_at);
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(job_id);
    query_builder.push("RETURNING *;");

    let updated_job = query_builder.build_query_as().fetch_one(&mut *tx).await?;

    tx.commit().await?;

    Ok(updated_job)
}

pub async fn soft_delete_job(pool: &PgPool, job_id: Uuid) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query!(
        "UPDATE jobs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
        job_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    if result.is_none() {
        return Err(AppError::NotFound(format!(
            "Job with id {} not found",
            job_id
        )));
    }

    tx.commit().await?;
    Ok(())
}
