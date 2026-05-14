# Cloudflare Email Setup

The account flow is wired for verification codes, but real outbound email still needs Cloudflare email setup on this account.

## What is missing

This Cloudflare account currently has:

- a Workers subdomain
- a D1 database
- no zone/domain attached for sending email

Because of that, the backend falls back to developer-mode verification codes instead of actually sending mail.

## To finish real email verification

1. Add a real domain to this Cloudflare account.
2. Enable Cloudflare Email Service / Email Routing for that domain.
3. Create a sending subdomain.
4. Add the sender configuration to the Worker.

## After setup

Once the domain exists on this account, update the Worker to:

- send verification emails from a real sender
- stop returning the developer preview code
- mark email delivery as live

Current backend URL:

- `https://fringe-api.anyajain110.workers.dev`
