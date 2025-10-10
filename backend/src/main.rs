use axum::{routing::{get, post}, Router, Json, extract::{State, FromRequestParts, Path, Query}, http::request::Parts};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr};
use tower_http::cors::{Any, CorsLayer, AllowOrigin};
use axum::http::HeaderValue;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use axum::http::StatusCode;
use tower::{BoxError, ServiceBuilder};
use tower_http::limit::RequestBodyLimitLayer;
use tower::limit::ConcurrencyLimitLayer;
use rand::RngCore;
use argon2::{Argon2, PasswordHasher, PasswordVerifier, password_hash::{SaltString, PasswordHash}};
use axum::response::IntoResponse;

type Db = sqlx::PgPool;

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

#[derive(Deserialize, Serialize)]
struct Echo {
    message: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = if let Ok(origins) = std::env::var("ALLOWED_ORIGINS") {
        let allowed: Vec<HeaderValue> = origins
            .split(',')
            .filter_map(|o| HeaderValue::from_str(o.trim()).ok())
            .collect();
        if !allowed.is_empty() {
            CorsLayer::new()
                .allow_origin(AllowOrigin::list(allowed))
                .allow_methods(Any)
                .allow_headers(Any)
        } else {
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        }
    } else {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    };

    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/thefox".into());
    let pool = sqlx::PgPool::connect(&database_url).await?;
    sqlx::migrate!("./backend/migrations").run(&pool).await?;

    let max_body_bytes: usize = std::env::var("MAX_BODY_BYTES").ok().and_then(|v| v.parse().ok()).unwrap_or(1_048_576); // 1MB default
    let max_concurrency: usize = std::env::var("MAX_CONCURRENCY").ok().and_then(|v| v.parse().ok()).unwrap_or(256);

    let app = Router::new()
        .route("/healthz", get(|| async { Json(Health { status: "ok" }) }))
        .route("/echo", post(echo))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/me", get(me))
        // catalog
        .route("/products", get(list_products))
        .route("/products/:id", get(get_product))
        .route("/products/sku/:sku", get(get_product_by_sku))
        // cart (auth required)
        .route("/cart", get(get_cart))
        .route("/cart/items", post(add_cart_item))
        .route("/cart/items/:productId", axum::routing::delete(remove_cart_item))
        .route("/cart/clear", post(clear_cart))
        // checkout + orders + payments
        .route("/checkout", post(checkout))
        .route("/orders", get(list_orders))
        .route("/orders/:id", get(get_order))
        .route("/payments/intent", post(create_payment_intent))
        .route("/payments/confirm", post(confirm_payment))
        // multivendor (protected by role-based checks)
        .route("/vendor/assign", post(assign_order))
        .route("/vendor/orders", get(list_vendor_orders))
        .route("/vendor/memberships", get(list_vendor_memberships))
        .route("/vendor/members", post(add_vendor_member))
        .route("/vendor/members", axum::routing::delete(remove_vendor_member))
        .route("/vendor/workers", get(list_vendor_workers))
        .route("/worker/assignments", get(list_worker_assignments))
        .route("/worker/assignments/:orderId/packed", post(mark_order_packed))
        .route("/vendor/assignments/:orderId/approve", post(approve_order_packed))
        .route("/notifications/emit", post(emit_notification))
        // delivery partner application
        .route("/partner/apply", post(partner_apply))
        .route("/partner/status", get(partner_status))
        .route("/partner/applications", get(list_partner_applications))
        .route("/partner/review", post(review_partner_application))
        .route("/partner/docs", post(update_partner_docs))
        .route("/uploads/presign", post(presign_upload))
        .route("/users", get(list_users).post(create_user))
        .with_state(pool)
        .layer(
            ServiceBuilder::new()
                .layer(ConcurrencyLimitLayer::new(max_concurrency))
                .layer(RequestBodyLimitLayer::new(max_body_bytes))
                .layer(cors)
                .map_err(|e: BoxError| {
                    tracing::error!(error = ?e, "request failed");
                    StatusCode::TOO_MANY_REQUESTS
                })
        );

    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {}", addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;
    Ok(())
}

async fn echo(Json(payload): Json<Echo>) -> Json<Echo> {
    Json(payload)
}

#[derive(Serialize, sqlx::FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    display_name: Option<String>,
    created_at: time::OffsetDateTime,
    password_hash: Option<String>,
}

#[derive(Deserialize)]
struct CreateUserBody {
    email: String,
    displayName: Option<String>,
}

async fn list_users(State(pool): State<Db>) -> Json<Vec<UserRow>> {
    let rows: Vec<UserRow> = sqlx::query_as!(
        UserRow,
        r#"select id, email, display_name, created_at, password_hash from users order by created_at desc limit 100"#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    Json(rows)
}

async fn create_user(State(pool): State<Db>, Json(body): Json<CreateUserBody>) -> Json<UserRow> {
    let id = Uuid::new_v4();
    let row: UserRow = sqlx::query_as!(
        UserRow,
        r#"insert into users (id, email, display_name) values ($1, $2, $3)
           returning id, email, display_name, created_at, password_hash"#,
        id,
        body.email,
        body.displayName
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    Json(row)
}

// removed inline migrate; using external SQL migrations

// ===== Auth =====
#[derive(Deserialize)]
struct RegisterBody { email: String, password: String, displayName: Option<String> }
#[derive(Deserialize)]
struct LoginBody { email: String, password: String }
#[derive(Serialize)]
struct TokenResponse { accessToken: String, refreshToken: String }
#[derive(Serialize, Deserialize)]
struct Claims { sub: String, exp: usize }

fn jwt_keys() -> (EncodingKey, DecodingKey) {
    // For demo only; replace with secure key management.
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".into());
    (EncodingKey::from_secret(secret.as_bytes()), DecodingKey::from_secret(secret.as_bytes()))
}

fn refresh_ttl_hours() -> i64 { std::env::var("REFRESH_TTL_HOURS").ok().and_then(|v| v.parse().ok()).unwrap_or(720) }

async fn register(State(pool): State<Db>, Json(body): Json<RegisterBody>) -> Result<Json<TokenResponse>, StatusCode> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    let hash = Argon2::default().hash_password(body.password.as_bytes(), &salt).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.to_string();
    let id = Uuid::new_v4();
    let user: Option<UserRow> = sqlx::query_as!(
        UserRow,
        r#"insert into users (id, email, display_name, password_hash)
           values ($1, $2, $3, $4)
           on conflict (email) do nothing
           returning id, email, display_name, created_at, password_hash"#,
        id, body.email, body.displayName, hash
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let user = user.ok_or(StatusCode::CONFLICT)?;
    let (ek, _dk) = jwt_keys();
    let exp = (chrono::Utc::now() + chrono::Duration::hours(8)).timestamp() as usize;
    let token = encode(&Header::default(), &Claims { sub: user.id.to_string(), exp }, &ek).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    // issue refresh token
    let refresh = Uuid::new_v4().to_string();
    let rexp = (chrono::Utc::now() + chrono::Duration::hours(refresh_ttl_hours())).naive_utc();
    sqlx::query!("insert into refresh_tokens (token, user_id, expires_at) values ($1, $2, $3)", refresh, user.id, rexp)
        .execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(TokenResponse { accessToken: token, refreshToken: refresh }))
}

async fn login(State(pool): State<Db>, Json(body): Json<LoginBody>) -> Result<Json<TokenResponse>, StatusCode> {
    let user = sqlx::query_as!(
        UserRow,
        r#"select id, email, display_name, created_at, password_hash from users where email = $1"#,
        body.email
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(user) = user else { return Err(StatusCode::UNAUTHORIZED) };
    let Some(stored) = user.password_hash.as_deref() else { return Err(StatusCode::UNAUTHORIZED) };
    let parsed = PasswordHash::new(stored).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Argon2::default().verify_password(body.password.as_bytes(), &parsed).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let (ek, _dk) = jwt_keys();
    let exp = (chrono::Utc::now() + chrono::Duration::hours(8)).timestamp() as usize;
    let token = encode(&Header::default(), &Claims { sub: user.id.to_string(), exp }, &ek).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let refresh = Uuid::new_v4().to_string();
    let rexp = (chrono::Utc::now() + chrono::Duration::hours(refresh_ttl_hours())).naive_utc();
    sqlx::query!("insert into refresh_tokens (token, user_id, expires_at) values ($1, $2, $3)", refresh, user.id, rexp)
        .execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(TokenResponse { accessToken: token, refreshToken: refresh }))
}

#[derive(Deserialize)]
struct RefreshBody { refreshToken: String }
#[derive(Serialize)]
struct RefreshResponse { accessToken: String, refreshToken: String }
async fn refresh_token(State(pool): State<Db>, Json(body): Json<RefreshBody>) -> Result<Json<RefreshResponse>, StatusCode> {
    let rec = sqlx::query!("select user_id, expires_at from refresh_tokens where token = $1", body.refreshToken)
        .fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(rec) = rec else { return Err(StatusCode::UNAUTHORIZED) };
    if rec.expires_at < chrono::Utc::now().naive_utc() { return Err(StatusCode::UNAUTHORIZED) }
    let user_id = rec.user_id;
    // rotate: delete old, create new
    sqlx::query!("delete from refresh_tokens where token = $1", body.refreshToken).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let new_refresh = Uuid::new_v4().to_string();
    let rexp = (chrono::Utc::now() + chrono::Duration::hours(refresh_ttl_hours())).naive_utc();
    sqlx::query!("insert into refresh_tokens (token, user_id, expires_at) values ($1, $2, $3)", new_refresh, user_id, rexp)
        .execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let (ek, _dk) = jwt_keys();
    let exp = (chrono::Utc::now() + chrono::Duration::hours(8)).timestamp() as usize;
    let access = encode(&Header::default(), &Claims { sub: user_id.to_string(), exp }, &ek).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(RefreshResponse { accessToken: access, refreshToken: new_refresh }))
}

struct AuthUser { user_id: Uuid }

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth = parts.headers.get(axum::http::header::AUTHORIZATION).and_then(|v| v.to_str().ok()).ok_or(StatusCode::UNAUTHORIZED)?;
        let token = auth.strip_prefix("Bearer ").ok_or(StatusCode::UNAUTHORIZED)?;
        let (_ek, dk) = jwt_keys();
        let data = decode::<Claims>(token, &dk, &Validation::default()).map_err(|_| StatusCode::UNAUTHORIZED)?;
        let user_id = Uuid::parse_str(&data.claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
        Ok(AuthUser { user_id })
    }
}

async fn me(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<Json<UserRow>, StatusCode> {
    let row = sqlx::query_as!(
        UserRow,
        r#"select id, email, display_name, created_at, password_hash from users where id = $1"#,
        user_id
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(user) = row else { return Err(StatusCode::NOT_FOUND) };
    Ok(Json(user))
}

// ===== Catalog =====
#[derive(Serialize, sqlx::FromRow)]
struct ProductRow {
    id: Uuid,
    name: String,
    description: Option<String>,
    price_cents: i64,
    currency: String,
    image_url: Option<String>,
    category: Option<String>,
    sku: Option<String>,
    created_at: time::OffsetDateTime,
}

#[derive(Deserialize)]
struct ProductQuery { q: Option<String>, category: Option<String>, limit: Option<i64> }

async fn list_products(State(pool): State<Db>, Query(q): Query<ProductQuery>) -> Json<Vec<ProductRow>> {
    let limit = q.limit.unwrap_or(50).clamp(1, 200);
    // simple search by name and optional category
    let (name_like, category) = (
        q.q.map(|s| format!("%{}%", s)),
        q.category,
    );

    let rows: Vec<ProductRow> = if let (Some(nl), Some(cat)) = (name_like.as_deref(), category.as_deref()) {
        sqlx::query_as!(
            ProductRow,
            r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
               from products
               where lower(name) like lower($1) and category = $2
               order by created_at desc
               limit $3"#,
            nl, cat, limit
        ).fetch_all(&pool).await.unwrap_or_default()
    } else if let Some(nl) = name_like.as_deref() {
        sqlx::query_as!(
            ProductRow,
            r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
               from products
               where lower(name) like lower($1)
               order by created_at desc
               limit $2"#,
            nl, limit
        ).fetch_all(&pool).await.unwrap_or_default()
    } else if let Some(cat) = category.as_deref() {
        sqlx::query_as!(
            ProductRow,
            r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
               from products
               where category = $1
               order by created_at desc
               limit $2"#,
            cat, limit
        ).fetch_all(&pool).await.unwrap_or_default()
    } else {
        sqlx::query_as!(
            ProductRow,
            r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
               from products
               order by created_at desc
               limit $1"#,
            limit
        ).fetch_all(&pool).await.unwrap_or_default()
    };

    Json(rows)
}

async fn get_product(State(pool): State<Db>, Path(id): Path<Uuid>) -> Result<Json<ProductRow>, StatusCode> {
    let row = sqlx::query_as!(
        ProductRow,
        r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
           from products where id = $1"#,
        id
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(product) = row else { return Err(StatusCode::NOT_FOUND) };
    Ok(Json(product))
}

async fn get_product_by_sku(State(pool): State<Db>, Path(sku): Path<String>) -> Result<Json<ProductRow>, StatusCode> {
    let row = sqlx::query_as!(
        ProductRow,
        r#"select id, name, description, price_cents, currency, image_url, category, sku, created_at
           from products where sku = $1"#,
        sku
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(product) = row else { return Err(StatusCode::NOT_FOUND) };
    Ok(Json(product))
}

// ===== Cart =====
#[derive(Serialize, sqlx::FromRow)]
struct CartItemRow {
    product_id: Uuid,
    quantity: i32,
    added_at: time::OffsetDateTime,
    // joined fields
    name: String,
    price_cents: i64,
    currency: String,
    image_url: Option<String>,
}

#[derive(Deserialize)]
struct AddCartItemBody { productId: Uuid, quantity: Option<i32> }

async fn ensure_cart(pool: &Db, user_id: Uuid) -> Result<(), StatusCode> {
    sqlx::query!(
        r#"insert into carts (user_id) values ($1) on conflict (user_id) do nothing"#,
        user_id
    ).execute(pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(())
}

async fn get_cart(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<Json<Vec<CartItemRow>>, StatusCode> {
    ensure_cart(&pool, user_id).await?;
    let rows = sqlx::query_as!(
        CartItemRow,
        r#"select ci.product_id, ci.quantity, ci.added_at,
                  p.name, p.price_cents, p.currency, p.image_url
           from cart_items ci
           join products p on p.id = ci.product_id
           where ci.user_id = $1
           order by ci.added_at desc"#,
        user_id
    ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(rows))
}

async fn add_cart_item(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Json(body): Json<AddCartItemBody>) -> Result<StatusCode, StatusCode> {
    ensure_cart(&pool, user_id).await?;
    let qty = body.quantity.unwrap_or(1).max(1);
    // upsert quantity
    sqlx::query!(
        r#"insert into cart_items (user_id, product_id, quantity)
           values ($1, $2, $3)
           on conflict (user_id, product_id) do update set quantity = cart_items.quantity + excluded.quantity, added_at = now()"#,
        user_id, body.productId, qty
    ).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!("update carts set updated_at = now() where user_id = $1", user_id).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn remove_cart_item(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Path(product_id): Path<Uuid>) -> Result<StatusCode, StatusCode> {
    sqlx::query!(
        r#"delete from cart_items where user_id = $1 and product_id = $2"#,
        user_id, product_id
    ).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!("update carts set updated_at = now() where user_id = $1", user_id).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn clear_cart(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<StatusCode, StatusCode> {
    sqlx::query!("delete from cart_items where user_id = $1", user_id).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!("update carts set updated_at = now() where user_id = $1", user_id).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

// ===== Checkout + Orders + Payments (stub) =====
#[derive(Serialize, sqlx::FromRow)]
struct OrderRow {
    id: Uuid,
    user_id: Uuid,
    total_cents: i64,
    currency: String,
    status: String,
    created_at: time::OffsetDateTime,
}

#[derive(Deserialize)]
struct CheckoutBody { }

async fn checkout(State(pool): State<Db>, AuthUser { user_id }: AuthUser, _body: Json<CheckoutBody>) -> Result<Json<OrderRow>, StatusCode> {
    // calc total from cart
    let items = sqlx::query!(
        r#"select ci.product_id, ci.quantity, p.price_cents, p.currency
           from cart_items ci join products p on p.id = ci.product_id where ci.user_id = $1"#,
        user_id
    ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if items.is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let currency = items[0].currency.clone().unwrap_or_else(|| "THB".into());
    let total: i64 = items.iter().map(|r| r.price_cents.unwrap_or(0) * (r.quantity as i64)).sum();

    let order_id = Uuid::new_v4();
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!(
        r#"insert into orders (id, user_id, total_cents, currency, status) values ($1, $2, $3, $4, 'pending')"#,
        order_id, user_id, total, currency
    ).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    for r in items {
        sqlx::query!(
            r#"insert into order_items (order_id, product_id, quantity, price_cents, currency)
               values ($1, $2, $3, $4, $5)"#,
            order_id, r.product_id, r.quantity, r.price_cents, r.currency
        ).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    // clear cart
    sqlx::query!("delete from cart_items where user_id = $1", user_id).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let order = sqlx::query_as!(
        OrderRow,
        r#"select id, user_id, total_cents, currency, status, created_at from orders where id = $1"#,
        order_id
    ).fetch_one(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(order))
}

async fn list_orders(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<Json<Vec<OrderRow>>, StatusCode> {
    let rows = sqlx::query_as!(
        OrderRow,
        r#"select id, user_id, total_cents, currency, status, created_at from orders where user_id = $1 order by created_at desc"#,
        user_id
    ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(rows))
}

async fn get_order(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Path(id): Path<Uuid>) -> Result<Json<OrderRow>, StatusCode> {
    let row = sqlx::query_as!(
        OrderRow,
        r#"select id, user_id, total_cents, currency, status, created_at from orders where id = $1 and user_id = $2"#,
        id, user_id
    ).fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(order) = row else { return Err(StatusCode::NOT_FOUND) };
    Ok(Json(order))
}

#[derive(Deserialize)]
struct PaymentIntentBody { orderId: Uuid }

#[derive(Serialize)]
struct PaymentIntentResponse { paymentIntentId: String, clientSecret: String }

async fn create_payment_intent(Json(body): Json<PaymentIntentBody>) -> impl IntoResponse {
    // stub: in real impl, create intent with provider (Stripe/Omise/SCB)
    let id = format!("pi_{}", Uuid::new_v4());
    let secret = format!("secret_{}", Uuid::new_v4());
    (StatusCode::OK, Json(PaymentIntentResponse { paymentIntentId: id, clientSecret: secret }))
}

#[derive(Deserialize)]
struct PaymentConfirmBody { paymentIntentId: String }

async fn confirm_payment(State(pool): State<Db>, Json(_body): Json<PaymentConfirmBody>) -> impl IntoResponse {
    // stub: mark order as paid after verifying provider webhook/confirmation
    // for now just 204
    (StatusCode::NO_CONTENT, ())
}

// ===== Multivendor Workflow =====
#[derive(Deserialize)]
struct AssignBody { orderId: Uuid, vendorId: Uuid, workerId: Option<Uuid> }

async fn assign_order(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Json(body): Json<AssignBody>) -> Result<StatusCode, StatusCode> {
    // require manager/owner in vendor_users
    require_role(&pool, user_id, body.vendorId, &["owner", "manager"]).await?;
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!(
        r#"insert into order_assignments (order_id, vendor_id, worker_id, status)
           values ($1, $2, $3, 'assigned')
           on conflict (order_id) do update set vendor_id = excluded.vendor_id, worker_id = excluded.worker_id, status = 'assigned', assigned_at = now()"#,
        body.orderId, body.vendorId, body.workerId
    ).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!("update orders set vendor_id = $1, status = 'assigned' where id = $2", body.vendorId, body.orderId)
        .execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_vendor_orders(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Query(q): Query<Option<Uuid>>) -> Result<Json<Vec<OrderRow>>, StatusCode> {
    // naive: if query param provided ?vendorId=, filter by it
    if let Some(vendor_id) = q {
        // require at least worker role to view
        require_role(&pool, user_id, vendor_id, &["owner", "manager", "worker"]).await?;
        let rows = sqlx::query_as!(
            OrderRow,
            r#"select id, user_id, total_cents, currency, status, created_at from orders where vendor_id = $1 order by created_at desc"#,
            vendor_id
        ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        return Ok(Json(rows));
    }
    // else return empty to avoid leaking all orders
    Ok(Json(vec![]))
}

async fn list_worker_assignments(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<Json<Vec<OrderRow>>, StatusCode> {
    let rows = sqlx::query_as!(
        OrderRow,
        r#"select o.id, o.user_id, o.total_cents, o.currency, o.status, o.created_at
           from order_assignments a join orders o on o.id = a.order_id
           where a.worker_id = $1 order by o.created_at desc"#,
        user_id
    ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(rows))
}

async fn mark_order_packed(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Path(order_id): Path<Uuid>) -> Result<StatusCode, StatusCode> {
    // ensure the requester is assigned worker for this vendor/order
    let assignment = sqlx::query!("select vendor_id, worker_id from order_assignments where order_id = $1", order_id)
        .fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(asg) = assignment else { return Err(StatusCode::NOT_FOUND) };
    // if worker_id is set, must match; otherwise must have worker role in vendor
    if let Some(w) = asg.worker_id { if w != user_id { return Err(StatusCode::FORBIDDEN); } }
    require_role(&pool, user_id, asg.vendor_id, &["owner", "manager", "worker"]).await?;
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let res = sqlx::query!(
        r#"update order_assignments set status = 'packed', packed_at = now()
           where order_id = $1 and (worker_id = $2 or worker_id is null)"#,
        order_id, user_id
    ).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if res.rows_affected() == 0 { return Err(StatusCode::FORBIDDEN); }
    sqlx::query!("update orders set status = 'packed' where id = $1", order_id).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn approve_order_packed(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Path(order_id): Path<Uuid>) -> Result<StatusCode, StatusCode> {
    let vendor = sqlx::query!("select vendor_id from order_assignments where order_id = $1", order_id)
        .fetch_one(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    require_role(&pool, user_id, vendor.vendor_id, &["owner", "manager"]).await?;
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!(
        r#"update order_assignments set status = 'approved', approved_at = now() where order_id = $1"#,
        order_id
    ).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query!("update orders set status = 'approved' where id = $1", order_id).execute(&mut *tx).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct EmitNotificationBody { toUserId: Option<Uuid>, toVendorId: Option<Uuid>, title: String, body: String }
async fn emit_notification(Json(_body): Json<EmitNotificationBody>) -> impl IntoResponse {
    // stub: integrate with FCM/Push later
    (StatusCode::NO_CONTENT, ())
}

// ===== Delivery Partner Application =====
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PartnerApplyBody {
    vehicle_type: String, // motorcycle | car | pickup
    full_name: String,
    phone: String,
    national_id: String,
    license_number: String,
    user_id: Option<Uuid>,
}

#[derive(Serialize, sqlx::FromRow)]
struct PartnerApplicationRow {
    id: Uuid,
    user_id: Option<Uuid>,
    vehicle_type: String,
    full_name: String,
    phone: String,
    national_id: String,
    license_number: String,
    doc_id_url: Option<String>,
    doc_license_url: Option<String>,
    status: String,
    submitted_at: time::OffsetDateTime,
    reviewed_at: Option<time::OffsetDateTime>,
}

async fn partner_apply(State(pool): State<Db>, Json(body): Json<PartnerApplyBody>) -> Result<Json<PartnerApplicationRow>, StatusCode> {
    // naive validation
    if !matches!(body.vehicle_type.as_str(), "motorcycle"|"car"|"pickup") { return Err(StatusCode::BAD_REQUEST); }
    let id = Uuid::new_v4();
    let row = sqlx::query_as!(
        PartnerApplicationRow,
        r#"insert into partner_applications (id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           returning id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url, status, submitted_at, reviewed_at"#,
        id,
        body.user_id,
        body.vehicle_type,
        body.full_name,
        body.phone,
        body.national_id,
        body.license_number,
        None::<String>,
        None::<String>
    ).fetch_one(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(row))
}

#[derive(Deserialize)]
struct PartnerStatusQuery { nationalId: Option<String>, userId: Option<Uuid> }

async fn partner_status(State(pool): State<Db>, Query(q): Query<PartnerStatusQuery>) -> Result<Json<Vec<PartnerApplicationRow>>, StatusCode> {
    if let Some(uid) = q.userId {
        let rows = sqlx::query_as!(
            PartnerApplicationRow,
            r#"select id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url, status, submitted_at, reviewed_at
               from partner_applications where user_id = $1 order by submitted_at desc"#,
            uid
        ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        return Ok(Json(rows));
    }
    if let Some(nid) = q.nationalId {
        let rows = sqlx::query_as!(
            PartnerApplicationRow,
            r#"select id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url, status, submitted_at, reviewed_at
               from partner_applications where national_id = $1 order by submitted_at desc"#,
            nid
        ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        return Ok(Json(rows));
    }
    Ok(Json(vec![]))
}

#[derive(Deserialize)]
struct PartnerListQuery { status: Option<String> }
async fn list_partner_applications(State(pool): State<Db>, auth: Option<AuthUser>, Query(q): Query<PartnerListQuery>) -> Result<Json<Vec<PartnerApplicationRow>>, StatusCode> {
    if let Ok(ids) = std::env::var("ADMIN_USER_IDS") {
        let set: std::collections::HashSet<String> = ids.split(',').map(|s| s.trim().to_string()).collect();
        let uid = auth.map(|a| a.user_id.to_string()).unwrap_or_default();
        if !uid.is_empty() && set.contains(&uid) {
            // allowed
        } else {
            return Err(StatusCode::FORBIDDEN);
        }
    }
    if let Some(st) = q.status.as_deref() {
        let rows = sqlx::query_as!(
            PartnerApplicationRow,
            r#"select id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url, status, submitted_at, reviewed_at
               from partner_applications where status = $1 order by submitted_at desc"#,
            st
        ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        return Ok(Json(rows));
    }
    let rows = sqlx::query_as!(
        PartnerApplicationRow,
        r#"select id, user_id, vehicle_type, full_name, phone, national_id, license_number, doc_id_url, doc_license_url, status, submitted_at, reviewed_at
           from partner_applications order by submitted_at desc"#,
    ).fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(rows))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PartnerReviewBody { id: Uuid, decision: String }
async fn review_partner_application(State(pool): State<Db>, auth: Option<AuthUser>, Json(body): Json<PartnerReviewBody>) -> Result<StatusCode, StatusCode> {
    if let Ok(ids) = std::env::var("ADMIN_USER_IDS") {
        let set: std::collections::HashSet<String> = ids.split(',').map(|s| s.trim().to_string()).collect();
        let uid = auth.map(|a| a.user_id.to_string()).unwrap_or_default();
        if uid.is_empty() || !set.contains(&uid) { return Err(StatusCode::FORBIDDEN); }
    }
    if !matches!(body.decision.as_str(), "approved"|"rejected") { return Err(StatusCode::BAD_REQUEST); }
    let res = sqlx::query!(
        r#"update partner_applications set status = $1, reviewed_at = now() where id = $2"#,
        body.decision, body.id
    ).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if res.rows_affected() == 0 { return Err(StatusCode::NOT_FOUND); }
    // notify (stub) - in production call push provider
    let _ = emit_notification(Json(EmitNotificationBody { toUserId: None, toVendorId: None, title: format!("Partner application {}", body.decision), body: format!("Application {} has been {}", body.id, body.decision) })).into_response();
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PartnerDocsBody { id: Uuid, docIdUrl: Option<String>, docLicenseUrl: Option<String> }
async fn update_partner_docs(State(pool): State<Db>, _auth: Option<AuthUser>, Json(body): Json<PartnerDocsBody>) -> Result<StatusCode, StatusCode> {
    let res = sqlx::query!(
        r#"update partner_applications set doc_id_url = coalesce($1, doc_id_url), doc_license_url = coalesce($2, doc_license_url) where id = $3"#,
        body.docIdUrl, body.docLicenseUrl, body.id
    ).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if res.rows_affected() == 0 { return Err(StatusCode::NOT_FOUND); }
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PresignBody { fileName: String, contentType: String, kind: String }
#[derive(Serialize)]
struct PresignResponse { uploadUrl: String, publicUrl: String }
async fn presign_upload(Json(body): Json<PresignBody>) -> Result<Json<PresignResponse>, StatusCode> {
    // Stub presign: echo a fake URL; replace with real S3/R2 presign later
    let key = format!("uploads/{}", body.fileName);
    let upload = format!("https://example-bucket.local/{}?signature=dummy", key);
    let public_url = format!("https://cdn.example.com/{}", key);
    Ok(Json(PresignResponse { uploadUrl: upload, publicUrl: public_url }))
}

// memberships listing
#[derive(Serialize)]
struct Membership { vendor_id: Uuid, role: String }
async fn list_vendor_memberships(State(pool): State<Db>, AuthUser { user_id }: AuthUser) -> Result<Json<Vec<Membership>>, StatusCode> {
    let rows = sqlx::query!("select vendor_id, role from vendor_users where user_id = $1", user_id)
        .fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let data = rows.into_iter().map(|r| Membership { vendor_id: r.vendor_id, role: r.role }).collect();
    Ok(Json(data))
}

// helper: role check
async fn require_role(pool: &Db, user_id: Uuid, vendor_id: Uuid, allowed: &[&str]) -> Result<(), StatusCode> {
    let row = sqlx::query!("select role from vendor_users where vendor_id = $1 and user_id = $2", vendor_id, user_id)
        .fetch_optional(pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(r) = row else { return Err(StatusCode::FORBIDDEN) };
    if allowed.iter().any(|a| *a == r.role) { Ok(()) } else { Err(StatusCode::FORBIDDEN) }
}

#[derive(Serialize)]
struct Worker { user_id: Uuid, role: String }
async fn list_vendor_workers(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Query(q): Query<Option<Uuid>>) -> Result<Json<Vec<Worker>>, StatusCode> {
    if let Some(vendor_id) = q {
        // only owner/manager can list workers
        require_role(&pool, user_id, vendor_id, &["owner", "manager"]).await?;
        let rows = sqlx::query!("select user_id, role from vendor_users where vendor_id = $1 and role in ('worker','manager','owner')", vendor_id)
            .fetch_all(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let data = rows.into_iter().map(|r| Worker { user_id: r.user_id, role: r.role }).collect();
        return Ok(Json(data));
    }
    Ok(Json(vec![]))
}

#[derive(Deserialize)]
struct AddMemberBody { vendorId: Uuid, userId: Uuid, role: String }
async fn add_vendor_member(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Json(body): Json<AddMemberBody>) -> Result<StatusCode, StatusCode> {
    // only owner can add members; allow manager to add worker
    let caller_role = sqlx::query!("select role from vendor_users where vendor_id = $1 and user_id = $2", body.vendorId, user_id)
        .fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(caller) = caller_role else { return Err(StatusCode::FORBIDDEN) };
    let is_owner = caller.role == "owner";
    let is_manager = caller.role == "manager";
    let can = is_owner || (is_manager && body.role == "worker");
    if !can { return Err(StatusCode::FORBIDDEN); }
    sqlx::query!(
        r#"insert into vendor_users (vendor_id, user_id, role)
           values ($1, $2, $3)
           on conflict (vendor_id, user_id) do update set role = excluded.role"#,
        body.vendorId, body.userId, body.role
    ).execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct RemoveMemberBody { vendorId: Uuid, userId: Uuid }
async fn remove_vendor_member(State(pool): State<Db>, AuthUser { user_id }: AuthUser, Json(body): Json<RemoveMemberBody>) -> Result<StatusCode, StatusCode> {
    // only owner/manager can remove workers; only owner can remove manager/owner
    let caller_role = sqlx::query!("select role from vendor_users where vendor_id = $1 and user_id = $2", body.vendorId, user_id)
        .fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(caller) = caller_role else { return Err(StatusCode::FORBIDDEN) };
    let target = sqlx::query!("select role from vendor_users where vendor_id = $1 and user_id = $2", body.vendorId, body.userId)
        .fetch_optional(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let Some(target) = target else { return Ok(StatusCode::NO_CONTENT) };
    let allowed = match target.role.as_str() {
        "worker" => caller.role == "owner" || caller.role == "manager",
        "manager" => caller.role == "owner",
        "owner" => false,
        _ => false,
    };
    if !allowed { return Err(StatusCode::FORBIDDEN); }
    sqlx::query!("delete from vendor_users where vendor_id = $1 and user_id = $2", body.vendorId, body.userId)
        .execute(&pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}


