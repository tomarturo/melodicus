# Auth email setup

Melodicus logs people in with a one-time code sent by email: no passwords.
The app asks Supabase to email a code (`signInWithOtp`), then checks the
code the person types (`verifyOtp`). The first code sent to a new address
creates the account.

Everything below is set in the Supabase dashboard; none of it lives in code.

## 1. Send email from melodicus.xyz

Supabase's built-in sender is for testing and only sends a few emails an
hour. Before launch:

1. Pick an email provider (Resend, Postmark, Amazon SES…) and verify
   `melodicus.xyz` with it by adding the DNS records it gives you (SPF and
   DKIM, plus DMARC).
2. **Authentication → SMTP Settings**: turn on custom SMTP and enter the
   provider's details. Sender: `Melodicus <account@melodicus.xyz>`. The login
   dialog tells people to search for this address (`LOGIN_EMAIL_FROM` in
   `src/AuthModal.tsx`), so change both together.
3. **Authentication → Rate Limits**: raise "emails sent per hour" to suit
   launch traffic.

## 2. Email templates

Supabase sends one of two emails when the app asks for a code. Both must show
`{{ .Token }}`, the code, or people get a link the app doesn't use.

| Template (Authentication → Email Templates) | Who gets it | Body | Subject |
| --- | --- | --- | --- |
| Confirm signup | Addresses without an account yet | `confirm_signup.html` | `Your Melodicus code: {{ .Token }}` |
| Magic Link | Returning people | `magic_link.html` | `Your Melodicus code: {{ .Token }}` |

Paste each file's whole contents in as the body.

## 3. Code settings

**Authentication → Providers → Email**:

- **Email OTP Length**: 6. The app accepts 6 to 10 digits, and its placeholder
  shows 6.
- **Email OTP Expiration**: 3600 seconds. The app and the emails both say codes
  expire after an hour.
- Leave **Confirm email** on: entering the code is the confirmation.

## 4. URLs

**Authentication → URL Configuration**: set **Site URL** to
`https://melodicus.xyz`. Codes don't use it, but any link Supabase still
sends (for example from the dashboard) will.
