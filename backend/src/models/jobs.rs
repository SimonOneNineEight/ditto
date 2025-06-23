use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "snake_case")]
enum JobSourceType {
    UserEntered,
    ScrapedJob,
}

impl JobSourceType {
    fn to_string(&self) -> String {
        match self {
            JobSourceType::UserEntered => "user_entered".to_string(),
            JobSourceType::ScrapedJob => "scraped".to_string(),
        }
    }

    fn from_string(s: &str) -> Result<Self, String> {
        match s {
            "user_entered" => Ok(JobSourceType::UserEntered),
            "scraped" => Ok(JobSourceType::ScrapedJob),
            _ => Err(format!(
                "Invalid Value: {}, Allowed values are user_entered and scraped",
                s
            )),
        }
    }
}

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

    pub job_source_type: JobSourceType,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_url: Option<String>,

    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
pub struct NewJob {
    #[validate(length(min = 1, message = "Title cannot be empty"))]
    pub title: String,

    #[validate(length(min = 1, message = "Company cannot be empty"))]
    pub company: String,

    #[validate(length(min = 1, message = "Location cannot be empty"))]
    pub location: String,

    #[validate(length(min = 1, message = "Job description cannot be empty"))]
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
            job_source_type: JobSourceType::UserEntered,
            is_expired: false,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted_at: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
pub struct UpdateJobRequest {
    #[validate(length(min = 1, message = "Title cannot be empty"))]
    pub title: String,

    #[validate(length(min = 1, message = "Company cannot be empty"))]
    pub company: String,

    #[validate(length(min = 1, message = "Location cannot be empty"))]
    pub location: String,

    #[validate(length(min = 1, message = "Job description cannot be empty"))]
    pub job_description: String,
    pub job_posting_id: Option<String>,
    pub job_url: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
pub struct PatchJobRequest {
    #[validate(length(min = 1, message = "Title cannot be empty"))]
    pub title: Option<String>,

    #[validate(length(min = 1, message = "Company cannot be empty"))]
    pub company: Option<String>,
    pub company_id: Option<Uuid>,

    #[validate(length(min = 1, message = "Location cannot be empty"))]
    pub location: Option<String>,

    #[validate(length(min = 1, message = "Job description cannot be empty"))]
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

#[derive(Debug, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserJob {
    pub id: Uuid,
    pub user_id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_description: String,
    pub job_type: String,
    pub is_expired: bool,

    pub job_source_type: JobSourceType,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_url: Option<String>,

    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, ToSchema)]
pub struct ScrapedJob {
    pub id: Uuid,
    pub external_id: Uuid,
    pub company_id: Uuid,
    pub scraper_batch_id: Uuid,
    pub title: String,
    pub company: String,
    pub location: String,
    pub job_description: String,
    pub job_type: String,
    pub scraper_source: String,
    pub is_expired: bool,

    pub job_source_type: JobSourceType,

    #[schema(value_type = String)]
    pub min_salary: Option<BigDecimal>,

    #[schema(value_type = String)]
    pub max_salary: Option<BigDecimal>,
    pub currency: Option<String>,
    pub job_url: Option<String>,

    pub posted_at: NaiveDateTime,
    pub last_seen_at: NaiveDateTime,
    pub last_scraped_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}
