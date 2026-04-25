# Phase 11 — Contact email

## Production (Resend)

Set:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (`re_…`) |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `DealASteal <onboarding@resend.dev>` or your domain |
| `CONTACT_INBOUND_EMAIL` | Inbox that receives contact submissions |

`POST /api/contact` sends HTML + plain text to `CONTACT_INBOUND_EMAIL` with **Reply-To** set to the visitor’s address.

## Local development

- **No keys:** with `NODE_ENV=development`, the API returns **200** and `delivered: false` plus a short `notice` (email is not sent). Logs still record the submission.
- **Skip provider:** set `CONTACT_EMAIL_SKIP_SEND=1` in `.env.local` to accept submissions without calling Resend.

## Anti-spam

- Hidden **honeypot** field `company` (leave empty). Non-empty values fail validation.

## Follow-ups

- Rate limiting (IP / token bucket) for serverless-friendly stores.
- Transactional templates (auth, digest) when those products ship.
