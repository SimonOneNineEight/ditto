use anyhow::Result;
use serde_json::json;

#[tokio::test]
async fn quick_dev() -> Result<()> {
    let hc = httpc_test::new_client("http://localhost:8081")?;

    let req_register = hc.do_post(
        "/api/users",
        json!({
            "name": "Riccado Martiniz",
            "email": "rm@rust.com",
            "password": "verygoodpassword123"
        }),
    );

    req_register.await?.print().await?;

    Ok(())
}
