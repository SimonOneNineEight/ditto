use axum::{extract::FromRequestParts, http::request::Parts, RequestPartsExt};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use uuid::Uuid;

use crate::error::{app_error::AppError, user_error::UserError};

use super::jwt::validate_token;

pub struct AuthenticatedUser {
    pub user_id: Uuid,
}

impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| UserError::InvalidCredentials)?;

        let claims = validate_token(bearer.token())?;

        if claims.token_type != "access" {
            return Err(UserError::Unauthorized.into());
        }

        println!("{:?}", claims);

        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| UserError::InvalidCredentials)?;

        Ok(AuthenticatedUser { user_id })
    }
}
