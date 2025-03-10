use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;

pub async fn connect() -> anyhow::Result<PgPool> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    Ok(pool)
}
