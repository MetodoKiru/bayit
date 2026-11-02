create table public.household_monthly_plans (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 month_start date not null,
 plan_data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(profile_id, month_start),
 check (extract(day from month_start)=1),
 check (jsonb_typeof(plan_data)='object')
);
alter table public.household_monthly_plans enable row level security;
revoke all on public.household_monthly_plans from public, anon, authenticated;
create function public.bayit_get_monthly_plan(p_month_start date)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_profile uuid; v_data jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_profile := public.bayit_current_profile_id();
 if v_profile is null then raise exception 'Profile not found'; end if;
 select plan_data into v_data from public.household_monthly_plans
 where profile_id=v_profile and month_start=date_trunc('month',p_month_start)::date;
 return coalesce(v_data,'{}'::jsonb);
end;
$$;
create function public.bayit_save_monthly_plan(p_month_start date,p_plan jsonb)
returns void language plpgsql security definer set search_path=''
as $$
declare v_profile uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_profile := public.bayit_current_profile_id();
 if v_profile is null then raise exception 'Profile not found'; end if;
 if p_plan is null or jsonb_typeof(p_plan)<>'object' or octet_length(p_plan::text)>50000 then raise exception 'Invalid plan'; end if;
 insert into public.household_monthly_plans(profile_id,month_start,plan_data)
 values(v_profile,date_trunc('month',p_month_start)::date,p_plan)
 on conflict(profile_id,month_start) do update set plan_data=excluded.plan_data,updated_at=now();
end;
$$;
revoke all on function public.bayit_get_monthly_plan(date) from public,anon;
revoke all on function public.bayit_save_monthly_plan(date,jsonb) from public,anon;
grant execute on function public.bayit_get_monthly_plan(date) to authenticated;
grant execute on function public.bayit_save_monthly_plan(date,jsonb) to authenticated;
