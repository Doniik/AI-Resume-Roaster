create table if not exists roasts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  resume_text text not null,
  roast_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists roasts_user_id_idx on roasts (user_id);

alter table roasts enable row level security;