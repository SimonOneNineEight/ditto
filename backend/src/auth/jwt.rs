use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::{
    env,
    sync::LazyLock,
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

use crate::error::{app_error::AppError, user_error::UserError};

struct Keys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl Keys {
    fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

static KEYS: LazyLock<Keys> = LazyLock::new(|| {
    let secret = env::var("JWT_SECERT").expect("JWT_SECRET must be set");
    Keys::new(secret.as_bytes())
});

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub token_type: String,
    pub expire: usize,
}

pub fn generate_token(
    user_id: Uuid,
    token_type: &str,
    experiation_seconds: usize,
) -> Result<String, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let claims = Claims {
        sub: user_id.to_string(),
        token_type: token_type.to_string(),
        expire: (now as usize) + experiation_seconds,
    };

    encode(&Header::default(), &claims, &KEYS.encoding).map_err(|_| AppError::InternalServerError)
}

pub fn validate_token(token: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &KEYS.decoding,
        &Validation::new(jsonwebtoken::Algorithm::HS256),
    )
    .map(|token_data| token_data.claims)
    .map_err(|_| UserError::InvalidCredentials.into())
}
