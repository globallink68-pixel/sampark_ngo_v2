alter table public.donations add constraint donation_payment_unique unique(razorpay_payment_id);
create table public.webhook_events(id uuid primary key default gen_random_uuid(),provider text not null default 'razorpay',event_id text not null,event_type text not null,payload_hash text not null,processed_at timestamptz,created_at timestamptz not null default now(),unique(provider,event_id));
alter table public.webhook_events enable row level security;
