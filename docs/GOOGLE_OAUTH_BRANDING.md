# Showing "Anima Machines" Instead of "something.supabase" on Google Sign-In

When users click "Continue with Google", the consent screen can show your Supabase project URL (e.g. `xxx.supabase.co`). You can improve this in two ways:

---

## 1. Google Cloud Console branding (quick, no code)

What users see on the **Google** consent screen is controlled in **Google Cloud Console**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. **APIs & Services** → **OAuth consent screen**.
3. Edit the **OAuth consent screen**:
   - **App name**: set to **Anima Machines** (or your product name).
   - **User support email**: your email.
   - **App logo**: upload your logo (optional but recommended).
   - **Application home page**: `https://anima.flowsxr.com`.
   - **Developer contact**: your email.

After publishing, the consent screen will show **"Anima Machines"** and your logo instead of a generic name. The **domain** in the URL bar may still be Google’s (accounts.google.com), which is normal.

---

## 2. Custom auth domain (your own domain in the redirect)

To have your **own domain** in the OAuth redirect (e.g. `auth.anima.flowsxr.com` instead of `gkxgwvruirxudorcsxln.supabase.co`):

1. **Supabase Dashboard** → your project → **Settings** → **Custom Domains** (or **Authentication** → **URL Configuration** depending on your plan).
2. If available, add a custom auth domain, e.g. `auth.anima.flowsxr.com`, and follow Supabase’s DNS (CNAME) instructions.
3. In **Google Cloud Console** → **Credentials** → your OAuth client:
   - **Authorized redirect URIs**: add  
     `https://auth.anima.flowsxr.com/auth/v1/callback`  
     (or whatever Supabase gives you for the custom auth URL).
4. In **Supabase** → **Authentication** → **URL Configuration**, ensure the redirect allow list includes that custom callback URL.

**Note:** Custom auth domains are a Supabase feature that may depend on your plan. If you don’t see it, use option 1 (branding) to at least show "Anima Machines" and your logo.

---

## Summary

- **Minimal effort:** Set **App name** and **App logo** in Google OAuth consent screen → users see "Anima Machines", not "something.supabase".
- **Full control:** Use a **Supabase custom auth domain** and point Google’s redirect URI to it so the redirect URL uses your domain.
