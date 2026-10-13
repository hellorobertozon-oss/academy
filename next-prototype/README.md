# Xzone Academy

Training portal for employees, built with Next.js, Supabase and BoardUI.

## Local development

1. Copy .env.example to .env.local and fill in the server-only credentials.
2. Run npm install.
3. Run npm run dev and open http://localhost:3000.

Use only the Academy Supabase project for this app. Keep the service role key server-side and out of source control.

## Invitation emails

Admin invitations use a React Email template and the Resend API. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the local or deployment environment. The sender address must belong to a verified Resend domain.

Run npm run email:preview and open http://localhost:3001 to preview the Polish, English, German and Czech invitation versions.

Password-reset messages still use Supabase Auth's email provider and need its SMTP configuration.
