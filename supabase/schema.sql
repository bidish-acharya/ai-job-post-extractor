create table if not exists public.saved_job_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_text text not null,
  analysis jsonb not null,
  status text not null default 'did_not_apply'
    check (status in ('applied', 'rejected', 'did_not_apply')),
  role_title text not null default '',
  company text not null default '',
  location text not null default '',
  fit_for_my_profile text not null default 'Maybe'
    check (fit_for_my_profile in ('Yes', 'Maybe', 'No')),
  application_priority text not null default 'Medium'
    check (application_priority in ('High', 'Medium', 'Low'))
);

create index if not exists saved_job_analyses_created_at_idx
  on public.saved_job_analyses (created_at desc);
