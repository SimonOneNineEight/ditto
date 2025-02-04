use axum::Router;

pub mod health;
pub mod users;

pub fn register_routes() -> Router {
    Router::new().merge(health::routes()).merge(users::routes())
}
