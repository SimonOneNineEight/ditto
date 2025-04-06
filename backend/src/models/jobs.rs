use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Job {
    pub id: Uuid,
    pub title: String,
    pub company_id: Uuid,
    pub company: String,
    pub location: String,
    pub job_description: String,
    pub job_type: String,
    pub is_expired: bool,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_posting_id: Option<String>,
    pub job_url: Option<String>,
    pub job_source: Option<String>,
    pub scraped_at: Option<NaiveDateTime>,

    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct NewJob {
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_description: String,
    pub job_posting_url: Option<String>,
    pub job_type: String,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,

    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

pub struct ManualJobInput {
    pub id: Uuid,
    pub title: String,
    pub company_id: Uuid,
    pub location: String,
    pub job_description: String,
    pub job_url: Option<String>,
    pub job_type: String,
    pub min_salary: Option<BigDecimal>,
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl ManualJobInput {
    pub fn into_job(self, company_name: String) -> Job {
        Job {
            id: self.id,
            title: self.title,
            company_id: self.company_id,
            company: company_name,
            location: self.location,
            job_description: self.job_description,
            job_url: self.job_url,
            job_type: self.job_type,
            min_salary: self.min_salary,
            max_salary: self.max_salary,
            currency: self.currency,
            job_posting_id: None,
            job_source: None,
            is_expired: false,
            scraped_at: None,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted_at: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateJobRequest {
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_posting_id: Option<String>,
    pub job_url: Option<String>,
    pub job_description: String,
    pub job_type: String,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_source: Option<String>,
    pub is_expired: bool,
    pub scraped_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PatchJobRequest {
    pub title: Option<String>,
    pub company_id: Option<Uuid>,
    pub company: Option<String>,
    pub location: Option<String>,
    pub job_description: Option<String>,
    pub job_type: Option<String>,
    pub is_expired: Option<bool>,
    pub job_posting_id: Option<String>,
    pub job_url: Option<String>,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_source: Option<String>,
    pub scraped_at: Option<NaiveDateTime>,
}
