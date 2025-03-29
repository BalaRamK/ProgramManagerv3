-- First, drop existing foreign key constraint
alter table public.milestones drop constraint if exists milestones_program_id_fkey;

-- Rename program_id column to goal_id
alter table public.milestones rename column program_id to goal_id;

-- Add new foreign key constraint
alter table public.milestones add constraint milestones_goal_id_fkey 
    foreign key (goal_id) references goals(id) on delete cascade;

-- Create tasks table
create table public.tasks (
    id uuid not null default extensions.uuid_generate_v4(),
    milestone_id uuid null,
    title text not null,
    description text null,
    status text null default 'NOT_STARTED'::text,
    assigned_to uuid null,
    due_date date null,
    created_at timestamp with time zone null default now(),
    user_id uuid not null,
    constraint tasks_pkey primary key (id),
    constraint tasks_assigned_to_fkey foreign key (assigned_to) references users(id) on delete set null,
    constraint tasks_user_id_fkey foreign key (user_id) references auth.users(id),
    constraint tasks_milestone_id_fkey foreign key (milestone_id) references milestones(id) on delete cascade
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;

-- Create policies for tasks
create policy "Users can view their own tasks"
    on public.tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
    on public.tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
    on public.tasks for update
    using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
    on public.tasks for delete
    using (auth.uid() = user_id);

-- Create milestone dependencies table
create table public.milestone_dependencies (
    id uuid not null default extensions.uuid_generate_v4(),
    milestone_id uuid null,
    depends_on_milestone_id uuid null,
    constraint milestone_dependencies_pkey primary key (id),
    constraint milestone_dependencies_milestone_id_fkey foreign key (milestone_id) references milestones(id) on delete cascade,
    constraint milestone_dependencies_depends_on_fkey foreign key (depends_on_milestone_id) references milestones(id) on delete cascade
);

-- Enable RLS for milestone dependencies
alter table public.milestone_dependencies enable row level security;

-- Create policies for milestone dependencies
create policy "Users can view milestone dependencies"
    on public.milestone_dependencies for select
    using (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    );

create policy "Users can insert milestone dependencies"
    on public.milestone_dependencies for insert
    with check (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    );

create policy "Users can delete milestone dependencies"
    on public.milestone_dependencies for delete
    using (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    );

-- Create resources table
create table public.milestone_resources (
    id uuid not null default extensions.uuid_generate_v4(),
    milestone_id uuid not null,
    user_id uuid not null,
    created_at timestamp with time zone default now(),
    constraint milestone_resources_pkey primary key (id),
    constraint milestone_resources_milestone_id_fkey foreign key (milestone_id) references milestones(id) on delete cascade,
    constraint milestone_resources_user_id_fkey foreign key (user_id) references users(id) on delete cascade
);

-- Enable RLS for milestone resources
alter table public.milestone_resources enable row level security;

-- Create policies for milestone resources
create policy "Users can view milestone resources"
    on public.milestone_resources for select
    using (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    );

create policy "Users can insert milestone resources"
    on public.milestone_resources for insert
    with check (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    );

create policy "Users can delete milestone resources"
    on public.milestone_resources for delete
    using (
        exists (
            select 1 from milestones m
            where m.id = milestone_id
            and m.user_id = auth.uid()
        )
    ); 