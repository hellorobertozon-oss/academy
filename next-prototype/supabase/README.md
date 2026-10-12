# Academy Supabase setup

This project is scoped to the Supabase project ref `aslzogstpyppmbdhvuss` (Academy). The separate `supabase` project is Magazyn. Check the root `AGENTS.md` before any database command.

The migration in `migrations/` is versioned source code. It has **not** been applied to a remote database. The app validates the configured Supabase hostname and refuses to connect if it points at Magazyn or another project.

## Local environment

Copy `next-prototype/.env.example` to `next-prototype/.env.local` and fill in the Academy project's URL and publishable key. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_`.

## First administrator

After the migration is deliberately applied to the Academy project:

1. In the Academy project's SQL Editor, add the first administrator's email to `public.user_invites` with role `admin`. Use the same lower-case email for the next step.
2. In Academy Authentication → Users, invite that email.
3. The database trigger consumes the invitation and creates its administrator profile when Supabase Auth creates the user.

This first account is bootstrapped in the Supabase dashboard. After it exists, administrators can invite other administrators and employees through the app.

## Auth email links

The Supabase Auth email templates should point to the app's confirmation route and include the token hash. For example:

- Invite: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/change-password`
- Password recovery: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/change-password`

Add the local app URL and the production callback URL to Academy Auth's allowed redirect URLs. Configure Supabase Auth SMTP with Resend before sending real account emails.

## Local checks

`npm test` runs the migration against an isolated PGlite database and tests invitation enforcement and row-level access. These tests do not connect to either Supabase project.

