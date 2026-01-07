#!/bin/bash

# Current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Testing webhook: https://n8n.creativetechnologists.nl/webhook/sign-ups"
echo "Timestamp: $TIMESTAMP"
echo "Note: No authentication required"
echo ""

# Make the request
curl -X POST https://n8n.creativetechnologists.nl/webhook/sign-ups \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"test@example.com\",
    \"timestamp\": \"$TIMESTAMP\",
    \"source\": \"test_script\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "Test complete!"
