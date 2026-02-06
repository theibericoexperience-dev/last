-- Create support_tickets table per user specification
create table if not exists public.support_tickets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  order_id text null,
  subject text not null,
  message text not null,
  status text not null default 'open'::text,
  priority text null default 'normal'::text,
  created_at timestamp with time zone not null default now(),
  constraint support_tickets_pkey primary key (id),
  constraint support_tickets_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint support_tickets_priority_check check (
    (
      priority = any (
        array[
          'low'::text,
          'normal'::text,
          'high'::text,
          'urgent'::text
        ]
      )
    )
  ),
  constraint support_tickets_status_check check (
    (
      status = any (
        array[
          'open'::text,
          'in_progress'::text,
          'resolved'::text,
          'closed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Support Ticket Replies (matches previous migration but kept separate for clarity if needed)
-- See: 20260204_create_support_replies.sql for the replies table.
