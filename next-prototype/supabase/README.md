# Academy Supabase setup

This project is scoped to the Supabase project ref `aslzogstpyppmbdhvuss` (Academy). The separate `supabase-magazyn` project is Magazyn. Check the root `AGENTS.md` before any database command.

The SQL migrations in `migrations/` are versioned source code. All sixteen migrations have been applied to the Academy project, and their filenames match the versions recorded by Supabase. The app validates the configured Supabase hostname and refuses to connect if it points at Magazyn or another project.

## Training content model

`20261013080612_academy_training_content.sql` adds the initial content CMS schema:

- `academy_languages` is an editable list seeded with Polish, English, German, Czech and French.
- A course has immutable published versions and at most one editable draft. Modules, lessons and their translations belong to a version.
- Lesson translations store Tiptap-compatible JSON, a validated YouTube video ID, titled key points and an optional client/seller conversation. Draft copies preserve these lesson sections and their translations.
- Publishing checks that each module and lesson has a title in the course's default language. Creating the next draft copies the published translations and content.
- `20261013080624_academy_content_ordering.sql` adds atomic module and lesson ordering functions. They accept only the complete ID list for a draft, so an employee or partial reorder cannot change published order.
- `20261013080846_academy_course_assignments.sql` adds course assignments for stores and individual employees. Employees can read only assigned, published courses and content translated into their preferred language. Untranslated modules and lessons stay hidden, and assignment records are admin-only.
- The employee learning pages read the course list, outline and lesson from these RLS-protected tables. Changing the app language updates the profile language used by those read policies.
- `20261013080904_academy_lesson_progress.sql` records one completion per employee and lesson, awards 10 points once, and exposes completion rows only to that employee and admins. Employees must complete an assigned, published lesson available in their language; writes go through a security-definer function.
- `20261013081002_academy_quizzes.sql` adds quizzes to lessons or modules, translated questions and answers, and an admin-only correct-answer key. Publishing requires complete quiz content in the course's default language. Employees see quizzes only when the course is assigned and the full quiz is translated into their preferred language. Attempts are unlimited, an 80% score passes, and the first pass awards 20 points.
- Admins create and translate quizzes in the course draft. The employee quiz list and quiz runner use the same RLS-protected content; scores and answer submissions are written through a server-validated database function. Correct answers are never returned to employee sessions.
- `20261013081014_academy_leaderboard.sql` exposes an all-time top-ten ranking plus the signed-in employee's own row through a restricted RPC. It returns only first name, surname initial, store city and points; employees do not get permission to read other profiles or email addresses.
- `20261013093057_academy_leaderboard_visibility.sql` creates a single-row `academy_settings` table. Employees can read the visibility flag, only admins can change it, and the leaderboard RPC returns no employee rows while the ranking is disabled. The default remains enabled.
- `20261013081038_academy_admin_progress.sql` adds an admin-only report RPC for assigned employee, store, course and module progress. It includes lesson completion, quiz attempts, latest score and last activity while keeping the underlying employee tables behind their existing policies.
- `20261013081050_academy_store_directory.sql` adds an authenticated map directory RPC. Admins see all stores and employee names; employees see only their assigned store and coworker names. The RPC returns no employee emails or profile IDs.

The content, ordering, assignment, lesson-progress, quiz, leaderboard, leaderboard-visibility, admin-report and store-directory migrations are exercised against isolated PGlite by `npm test`; the tests cover language filtering, row-level access, translation editing, quiz scoring, unlimited attempts, leaderboard privacy and administrator-controlled visibility, admin-only progress reporting, store-directory privacy and idempotent point awards without connecting to either remote Supabase project.

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

`npm test` runs the migrations against an isolated PGlite database and tests invitation enforcement, row-level access, lesson completion, quiz scoring, leaderboard access and visibility controls, admin progress reporting and store-directory access. These tests do not connect to either Supabase project.
