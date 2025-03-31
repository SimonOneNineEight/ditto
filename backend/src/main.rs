use std::sync::Arc;

use backend::{app::create_app, db, utils::state::AppState};
use dotenvy::dotenv;
use listenfd::ListenFd;
use tokio::net::TcpListener;
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let subscriber = FmtSubscriber::builder().finish();

    tracing::subscriber::set_global_default(subscriber).expect("Failed to set logger!");

    tracing::info!("Starting the Axum server...");

    let db_pool = db::connection::connect()
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database");

    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await
        .expect("Failed to run migrations");

    tracing::info!("Migrations run successfully");

    let app_state = Arc::new(AppState { db: db_pool });

    let app = create_app(app_state.clone());

    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0).unwrap() {
        // if we are given a tcp listener on listen fd 0, we use that one
        Some(listener) => {
            listener.set_nonblocking(true).unwrap();
            TcpListener::from_std(listener).unwrap()
        }
        // otherwise fall back to local listening
        None => TcpListener::bind("127.0.0.1:8081").await.unwrap(),
    };

    // run it
    tracing::info!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
