#!/usr/bin/env bash
# Creates or rotates a Mapbox API key in AWS Secrets Manager.
# Usage: ./mapbox-secret.sh <secret-name> <mapbox-api-key> [region]

set -euo pipefail

SECRET_NAME="${1:?Usage: $0 <secret-name> <mapbox-api-key> [region]}"
API_KEY="${2:?Usage: $0 <secret-name> <mapbox-api-key> [region]}"
REGION="${3:-eu-west-1}"

SECRET_JSON=$(jq -nc --arg key "$API_KEY" '{api_key: $key}')

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Rotating $SECRET_NAME..."
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$SECRET_JSON" \
    --region "$REGION"
else
  echo "Creating $SECRET_NAME..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Mapbox API key" \
    --secret-string "$SECRET_JSON" \
    --region "$REGION"
fi

echo "Done."