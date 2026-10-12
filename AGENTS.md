# Project Instructions

## Supabase projects: keep them separate

The Supabase projects below belong to the same account but contain different applications and data. Never treat them as interchangeable.

| Application | Codex MCP alias | Project ref | Project URL |
| --- | --- | --- | --- |
| Academy (this repository) | `supabase-academy` | `aslzogstpyppmbdhvuss` | `https://aslzogstpyppmbdhvuss.supabase.co` |
| Magazyn (existing application) | `supabase` | `oxpspyinexdzacumydqu` | `https://oxpspyinexdzacumydqu.supabase.co` |

The Academy project ref was supplied by the user. The Magazyn ref comes from the Codex MCP configuration that existed before Academy was added; verify it against the Supabase dashboard before any database mutation.

Before running SQL that changes data, schema, policies, functions, or storage; applying a migration; seeding, resetting, or deploying database changes:

1. Confirm which application the task concerns.
2. Inspect the matching MCP alias with `codex mcp get supabase-academy` or `codex mcp get supabase` and verify its `project_ref` matches this table. Check again immediately before the mutation.
3. Only mutate the database when the user explicitly requests the change and the target project is unambiguous. If the alias or project ref does not match, stop and clarify before proceeding.

Keep both MCP entries project-scoped and read-only by default. Do not change their project refs, remove either entry, disable read-only mode, or use credentials from one project for the other unless the user explicitly requests that specific change. Never commit Supabase secrets or service-role keys.
