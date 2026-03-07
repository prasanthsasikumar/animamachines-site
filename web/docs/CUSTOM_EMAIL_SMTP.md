# Auth Setup Notes

## Redirect URLs

In Supabase: **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) or your production URL
- **Redirect URLs**: add `http://localhost:3000/auth/callback` (and production `https://yourdomain.com/auth/callback`)

The confirmation email link redirects to `/auth/callback?token_hash=...&type=signup`; without this URL allowed, verification can fail.

---

# Custom Auth Emails (flowsxr or your domain)

Supabase sends auth emails (confirm signup, reset password) from `amil.appl.supabase` by default. To use your own sender (e.g. `noreply@flowsxr.com`):

## Option 1: Custom SMTP (Resend)

1. **Resend**: Sign up at [resend.com](https://resend.com), verify your domain (e.g. flowsxr.com), create an API key.

2. **Supabase Dashboard** → Project → **Authentication** → **SMTP Settings**:
   - Enable **Custom SMTP**
   - **Sender email**: `noreply@flowsxr.com` (or any verified address)
   - **Sender name**: `Anima Machines` (or your brand)
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (or `587`)
   - **Username**: `resend`
   - **Password**: Your Resend API key

3. Save. All auth emails will now be sent via Resend from your domain.

## Option 2: Auth Email Hook (Edge Function)

For full control over templates, use [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) with a custom Edge Function that sends via Resend.
