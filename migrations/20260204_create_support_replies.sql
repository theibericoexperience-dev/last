-- Create support_ticket_replies table to store conversation history
create table if not exists public.support_ticket_replies (
  id uuid not null default gen_random_uuid (),
  ticket_id uuid not null,
  user_id uuid null, -- Link to auth.users. Null if system message, or use boolean is_staff
  message text not null,
  is_staff boolean default false,
  created_at timestamp with time zone null default now(),
  constraint support_ticket_replies_pkey primary key (id),
  constraint support_ticket_replies_ticket_id_fkey foreign KEY (ticket_id) references support_tickets (id) on delete CASCADE,
  constraint support_ticket_replies_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

-- Create index for faster lookups
create index if not exists idx_support_ticket_replies_ticket_id on public.support_ticket_replies using btree (ticket_id) TABLESPACE pg_default;
