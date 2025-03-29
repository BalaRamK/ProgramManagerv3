-- Create goals table
create table public.goals (
    id uuid not null default gen_random_uuid(),
    program_id uuid not null,
    name text not null,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid not null,
    constraint goals_pkey primary key (id),
    constraint goals_program_id_fkey foreign key (program_id) references programs(id) on delete cascade,
    constraint goals_user_id_fkey foreign key (user_id) references auth.users(id)
);

-- Enable RLS
alter table public.goals enable row level security;

-- Create policies
create policy "Users can view their own goals"
    on public.goals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own goals"
    on public.goals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own goals"
    on public.goals for update
    using (auth.uid() = user_id);

create policy "Users can delete their own goals"
    on public.goals for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger set_goals_updated_at
    before update on public.goals
    for each row
    execute function handle_updated_at(); 