-- Fix vendor_users schema and add helpful indexes

-- Add vendor_id column if missing
alter table if exists vendor_users
  add column if not exists vendor_id uuid;

-- Add foreign key for vendor_id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'vendor_users' and constraint_type = 'FOREIGN KEY' and constraint_name = 'vendor_users_vendor_id_fkey'
  ) then
    alter table vendor_users
      add constraint vendor_users_vendor_id_fkey foreign key (vendor_id) references vendors(id) on delete cascade;
  end if;
end $$;

-- Reset primary key to (vendor_id, user_id)
do $$
declare
  pk_name text;
begin
  select constraint_name into pk_name
  from information_schema.table_constraints
  where table_name = 'vendor_users' and constraint_type = 'PRIMARY KEY'
  limit 1;

  if pk_name is not null then
    execute format('alter table vendor_users drop constraint %I', pk_name);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'vendor_users' and constraint_type = 'PRIMARY KEY'
  ) then
    alter table vendor_users add constraint vendor_users_pkey primary key (vendor_id, user_id);
  end if;
end $$;

-- Ensure vendor_id is not null (will fail if existing null rows present)
alter table if exists vendor_users
  alter column vendor_id set not null;

-- Helpful indexes
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_product_id on order_items(product_id);
create index if not exists idx_vendor_users_user_id on vendor_users(user_id);


