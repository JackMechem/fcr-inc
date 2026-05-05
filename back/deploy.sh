#!/usr/bin/env bash
set -euo pipefail

IMAGE=fcr-backend
NGINX_CONF=./nginx/default.conf
NGINX_CONTAINER=fcr-nginx
NETWORK=fcr-net

# Ensure the Docker network exists
docker network create "$NETWORK" 2>/dev/null || true

# Determine active / next slot
if docker ps --format '{{.Names}}' | grep -q "^fcr-backend-blue$"; then
    ACTIVE=blue
    NEXT=green
elif docker ps --format '{{.Names}}' | grep -q "^fcr-backend-green$"; then
    ACTIVE=green
    NEXT=blue
else
    ACTIVE=""
    NEXT=blue
fi

echo "[deploy] Slot: ${ACTIVE:-none} → $NEXT"

# Build the new image
echo "[deploy] Building image..."
docker build -t "$IMAGE" .

# Start the next container (no host port — nginx is the only ingress)
echo "[deploy] Starting fcr-backend-$NEXT..."
docker rm -f "fcr-backend-$NEXT" 2>/dev/null || true
docker run -d \
    --name "fcr-backend-$NEXT" \
    --network "$NETWORK" \
    --env-file .env \
    "$IMAGE"

# Poll Docker health status (set by the HEALTHCHECK in the Dockerfile)
echo "[deploy] Waiting for health check..."
ATTEMPTS=0
MAX=60
while [ $ATTEMPTS -lt $MAX ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "fcr-backend-$NEXT" 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
        echo "[deploy] fcr-backend-$NEXT is healthy"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX ]; then
        echo "[deploy] ERROR: timed out waiting for health. Rolling back."
        docker rm -f "fcr-backend-$NEXT"
        exit 1
    fi
    echo "  [$ATTEMPTS/$MAX] $STATUS..."
    sleep 3
done

# Rewrite the nginx upstream to point at the new slot
echo "[deploy] Switching nginx upstream to fcr-backend-$NEXT..."
cat > "$NGINX_CONF" <<NGINX
upstream backend {
    server fcr-backend-$NEXT:8080;
}

server {
    listen 80;

    location / {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Connection        "";
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}
NGINX

# Reload or start nginx
if docker ps --format '{{.Names}}' | grep -q "^$NGINX_CONTAINER$"; then
    # Graceful reload — in-flight requests finish on the old worker before it exits
    docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "[deploy] nginx reloaded"
else
    docker compose up -d nginx
    echo "[deploy] nginx started"
fi

# Stop the old container only after nginx has switched over
if [ -n "$ACTIVE" ]; then
    echo "[deploy] Stopping fcr-backend-$ACTIVE..."
    docker rm -f "fcr-backend-$ACTIVE"
fi

echo "[deploy] Done. Active: fcr-backend-$NEXT"
