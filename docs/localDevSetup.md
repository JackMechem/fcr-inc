# Local Dev Setup Guide

This guide walks through getting the full FCR stack running locally, including the Stripe webhook listener for testing checkout/reservation flow end-to-end.

---

## Prerequisites

- Java 21+
- Maven
- Node.js + npm
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- A Stripe test account (ask a team member for access to the shared test keys)

---

## 1. Backend Setup

### Configure environment variables

Create a `.env` file inside `back/` (copy from a teammate or use the template below):

```env
DB_URL=jdbc:mysql://<host>:3306/fcr_db
DB_USER=<db_user>
DB_PASSWORD=<db_password>

STRICT_QUERY_PARAMS=true

STRIPE_SECRET_KEY=sk_test_<your_test_key>
STRIPE_WEBHOOK_SECRET=whsec_<fill_in_after_step_3>

RESEND_API_KEY=re_<your_resend_key>
MAIL_FROM=confirmation@jackmechem.dev
```

> **Note:** Leave `STRIPE_WEBHOOK_SECRET` blank for now — you'll get it in Step 3.

### Run the backend

```bash
cd back
make run
# or directly:
mvn exec:java
```

The server starts on port `8080` by default.

---

## 2. Frontend Setup

```bash
cd front
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## 3. Stripe Webhook Listener

### Install the Stripe CLI

**Linux:**
```bash
curl -s https://packages.stripe.dev/api/latest/cli/linux | sudo bash
# or
sudo apt install stripe
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

### Login

```bash
stripe login
```

Follow the browser prompt to authenticate with your Stripe account.

### Start the listener

```bash
stripe listen --forward-to localhost:8080/stripe/webhook
```

You'll see output like:
```
> Ready! You are using Stripe API Version [...]
> Webhook signing secret: whsec_xxxxxxxxxxxxxxxxxxxx
```

Copy that `whsec_...` value and paste it into your `.env` as `STRIPE_WEBHOOK_SECRET`, then **restart the backend**.

---

## 4. Test the Full Flow

1. Go to `http://localhost:3000` and navigate to checkout
2. Use a Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Complete the payment
4. Watch the backend terminal — the webhook will fire and create the reservation + send a confirmation email

### Trigger events manually (optional)

```bash
# Simulate a completed checkout session
stripe trigger checkout.session.completed

# Simulate a successful payment intent
stripe trigger payment_intent.succeeded
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `STRIPE_WEBHOOK_SECRET is not set` | Make sure `.env` has the `whsec_...` value and you restarted the backend |
| Webhook fires but reservation isn't created | Check backend logs for the full stack trace — usually a missing field or DB issue |
| `stripe listen` shows no events | Make sure the frontend is hitting `localhost:8080`, not the production API |
| Port conflict on 8080 | Kill whatever is on that port: `lsof -ti:8080 \| xargs kill` |
