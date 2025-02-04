use std::env;

use dotenvy::dotenv;
use sqlx::{postgres::PgPoolOptions, PgPool};

pub async fn connect() -> anyhow::Result<PgPool> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    Ok(pool)
}
