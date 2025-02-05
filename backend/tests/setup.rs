use dotenvy::dotenv;
use sqlx::{migrate::Migrator, postgres::PgPoolOptions, Executor, PgPool};
use std::{env, path::Path};

use backend::app::create_app;

pub async fn setup_test_db() -> PgPool {
    dotenv().ok(); // ✅ Load .env (including TEST_DATABASE_URL)

    let database_url = env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL must be set");

    println!("🔍 Using TEST_DATABASE_URL: {}", database_url);

    let pool = PgPoolOptions::new()
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    let migrator = Migrator::new(Path::new("migrations")).await.unwrap();
    migrator.run(&pool).await.unwrap();

    pool.execute("TRUNCATE users RESTART IDENTITY CASCADE")
        .await
        .expect("Failed to clean test database");

    pool
}

pub async fn setup_test_app() -> axum::Router {
    let db = setup_test_db().await;
    create_app().layer(axum::Extension(db))
}
