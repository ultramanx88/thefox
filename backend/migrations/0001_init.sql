-- Users
create table if not exists users (
  id uuid primary key,
  email text not null unique,
  display_name text,
  password_hash text,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id uuid primary key,
  name text not null,
  description text,
  price_cents bigint not null,
  currency text not null default 'THB',
  image_url text,
  category text,
  sku text unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_name on products using gin (to_tsvector('simple', name));

-- Carts
create table if not exists carts (
  user_id uuid primary key,
  updated_at timestamptz not null default now()
);
create table if not exists cart_items (
  user_id uuid not null references carts(user_id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity int not null check (quantity > 0),
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Orders
create table if not exists orders (
  id uuid primary key,
  user_id uuid not null,
  vendor_id uuid,
  total_cents bigint not null,
  currency text not null default 'THB',
  status text not null default 'pending', -- pending -> assigned -> packed -> approved
  created_at timestamptz not null default now()
);
create table if not exists order_items (
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null,
  quantity int not null,
  price_cents bigint not null,
  currency text not null,
  primary key (order_id, product_id)
);

-- Vendors
create table if not exists vendors (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists vendor_users (
  vendor_id uuid not null references vendors(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner','manager','worker')),
  primary key (vendor_id, user_id)
);
create table if not exists order_assignments (
  order_id uuid not null references orders(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  worker_id uuid,
  status text not null default 'assigned', -- assigned -> packed -> approved
  assigned_at timestamptz not null default now(),
  packed_at timestamptz,
  approved_at timestamptz,
  primary key (order_id)
);

-- Partner applications
create table if not exists partner_applications (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  vehicle_type text not null check (vehicle_type in ('motorcycle','car','pickup')),
  full_name text not null,
  phone text not null,
  national_id text not null,
  license_number text not null,
  doc_id_url text,
  doc_license_url text,
  status text not null default 'pending', -- pending -> approved -> rejected
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Refresh tokens
create table if not exists refresh_tokens (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);


