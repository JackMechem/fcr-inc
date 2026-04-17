# API Key Guide

All requests to the FCR API require an `X-API-Key` header when the `API_KEY` environment variable is set on the server. If `API_KEY` is not set, the check is skipped (useful for local development).

---

## Generating a Key

Run this in your terminal to generate a secure random key:

```bash
openssl rand -hex 32
```

Example output:
```
a3f1c2e4b7d09e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4
```

---

## Setting the Key on the Server

Add the key to your server's environment variables:

```bash
export API_KEY=a3f1c2e4b7d09e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4
```

Or add it to your `.env` file / deployment config (Railway, Render, etc.):

```
API_KEY=a3f1c2e4b7d09e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4
```

---

## Using the Key on the Frontend

Include the key as a header on every request:

```
X-API-Key: <your-key>
```

Example fetch:
```js
fetch("https://your-api.com/cars", {
  headers: {
    "X-API-Key": API_KEY,
    "Authorization": `Bearer ${sessionToken}` // if the route requires auth
  }
})
```

Store the key in an environment variable on the frontend (e.g. `VITE_API_KEY`) — never hard-code it in source.

---

## Rotating the Key

1. Generate a new key with `openssl rand -hex 32`
2. Update `API_KEY` in your server environment
3. Update the key in your frontend environment
4. Redeploy both

---

## Disabling the Key (Local Development)

Leave `API_KEY` unset and the server will not enforce key checking:

```bash
unset API_KEY
```

---

## Errors

| Status | Cause |
|--------|-------|
| `401` | `X-API-Key` header is missing or does not match the configured key |
