use axum::Extension;
use backend::app::create_app;
use listenfd::ListenFd;
use sqlx::PgPool;
use tokio::net::TcpListener;
use tracing_subscriber::FmtSubscriber;

mod db;
mod models;

#[tokio::main]
async fn main() {
    let subscriber = FmtSubscriber::builder().finish();

    tracing::subscriber::set_global_default(subscriber).expect("Failed to set logger!");

    tracing::info!("Starting the Axum server...");

    //TODO: Connect to database
    //
    let db_pool: PgPool = db::connection::connect()
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database");

    let app = create_app().layer(Extension(db_pool.clone()));

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
