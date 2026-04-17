# FCR Auth — Frontend Integration Guide

## Overview

Authentication is **magic-link only** (no passwords). A user record does not need to exist before registering — full user details can be provided at registration time, or added later.

---

## Entities

**Account** (stored in `accounts` table)
```
acctId              long
name                string
email               string
dateCreated         ISO-8601 timestamp
dateEmailConfirmed  ISO-8601 timestamp | null
user                long (userId) | User object
role                "CUSTOMER" | "STAFF" | "ADMIN"
```

**Session Token** — a UUID string sent as `Authorization: Bearer <token>` on every authenticated request.

---

## Auth Flow

```
1. POST /auth/register   ← creates Account (and optionally a User), sends magic link email
         |
2. User clicks link in email
         |
3. GET /auth/confirm/{token}   ← returns Bearer session token
         |
4. Store token, include on every subsequent request:
   Authorization: Bearer <token>
         |
5. To log in again later: POST /auth/send-link
```

---

## Endpoints

---

### `GET /auth/account-exists?email=...`
Checks whether an account exists for a given email. Returns no body — use the status code only.

**No auth required.**

| Status | Meaning |
|--------|---------|
| `200` | Account exists |
| `404` | No account for this email |
| `400` | `email` query parameter missing |

---

### `POST /auth/register`
Creates an account. Optionally creates a linked user record in the same request if full user details are provided.

**No auth required.**

**Request body:**
```json
{
  "email": "jane@example.com",
  "role": "CUSTOMER",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "555-1234",
  "address": {
    "buildingNumber": "123",
    "streetName": "Main St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601"
  },
  "driversLicense": {
    "driversLicense": "D1234567",
    "state": "IL",
    "expirationDate": 1893456000,
    "dateOfBirth": 725846400
  }
}
```

**Field rules:**

| Field | Required | Notes |
|-------|----------|-------|
| `email` | Yes | |
| `role` | No | Defaults to `CUSTOMER`. Values: `CUSTOMER` \| `STAFF` \| `ADMIN` |
| `firstName` … `driversLicense` | No | If any user field is provided, all must be provided. Ignored if a user record already exists for this email. |
| `name` | Conditional | Required only if no user fields are provided and no existing user record is found. Used as a display name on the account. |

**Behavior based on existing user record:**

| Situation | Result |
|-----------|--------|
| User record exists for email | Account linked automatically; provided user fields ignored |
| No user record + all user fields provided | User record created and linked |
| No user record + no user fields | Account created without a linked user; `name` required |

**Success `201`:**
```json
{ "message": "Account created. Check your email to confirm." }
```

**Errors:**
| Status | Cause |
|--------|-------|
| `400` | Missing `email`, invalid `role`, partial user fields, or missing `name` when required |
| `409` | Account already exists for this email |

---

### `GET /auth/confirm/{token}`
Called when the user clicks the magic link. Confirms the email and returns a session token.

**No auth required. No body.** Token is in the URL path.

**Success `200`:**
```json
{
  "token": "uuid-session-token",
  "acctId": 1,
  "userId": 42,
  "role": "CUSTOMER",
  "sessionExpiresAt": "2026-04-24T12:00:00Z"
}
```

- `userId` — present only if the account has a linked user

**Errors:**
| Status | Cause |
|--------|-------|
| `404` | Token not found, already used, or expired |

> Links expire in **24 hours**. Sessions last **7 days**.

---

### `POST /auth/send-link`
Sends a new magic link to an existing confirmed account. Use this for all subsequent logins.

**No auth required.**

**Request body:**
```json
{ "email": "jane@example.com" }
```

**Always `200`** (to prevent email enumeration):
```json
{ "message": "If that email has a confirmed account, a login link has been sent." }
```

**Errors:**
| Status | Cause |
|--------|-------|
| `400` | Missing email |

---

## Using the Session Token

Include on every authenticated request:
```
Authorization: Bearer <token>
```

Role → permissions mapping:
| Role | Can do |
|------|--------|
| `CUSTOMER` | GET (read) |
| `STAFF` | GET + POST + PATCH |
| `ADMIN` | GET + POST + PATCH + DELETE |

---

## Accounts Endpoint

Accounts are **created only via `/auth/register`**. The `/accounts` endpoint is for reading and managing existing accounts.

| Method | Path | Auth required |
|--------|------|--------------|
| `GET` | `/accounts` | CUSTOMER+ |
| `GET` | `/accounts/{acctId}` | CUSTOMER+ |
| `PATCH` | `/accounts/{acctId}` | STAFF+ |
| `DELETE` | `/accounts/{acctId}` | ADMIN |

**PATCH body** (any subset of fields):
```json
{
  "name": "Jane Smith",
  "role": "STAFF"
}
```

---

## Frontend Session State

Store the following after a successful `/auth/confirm` response:

```json
{
  "token": "...",
  "acctId": 1,
  "userId": 42,
  "role": "CUSTOMER",
  "sessionExpiresAt": "2026-04-24T12:00:00Z"
}
```

Check `sessionExpiresAt` before making requests — if expired, redirect to the send-link flow.
