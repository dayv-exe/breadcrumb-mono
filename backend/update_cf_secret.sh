#!/usr/bin/env bash
set -e

REGION="eu-west-2"

if [[ ! -f cloudfront_private_key.pem || ! -f cloudfront_public_key.pem ]]; then
  echo "Missing key files."
  echo "Expected in current directory:"
  echo "  cloudfront_private_key.pem"
  echo "  cloudfront_public_key.pem"
  exit 1
fi

read -p "Stack name (e.g. breadcrumb-stack-test): " STACK_NAME
read -p "CloudFront PublicKey ID (key_pair_id, starts with K...): " KEY_PAIR_ID

echo "Looking up secret created by CloudFormation..."

SECRET_ID=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --logical-resource-id CloudFrontKeysSecret \
  --region "$REGION" \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

if [[ -z "$SECRET_ID" || "$SECRET_ID" == "None" ]]; then
  echo "Could not find CloudFrontKeysSecret in stack."
  exit 1
fi

echo "Found secret: $SECRET_ID"
echo "Updating secret..."

aws secretsmanager put-secret-value \
  --region "$REGION" \
  --secret-id "$SECRET_ID" \
  --secret-string "$(python3 - <<PY
import json

with open("cloudfront_private_key.pem", "r", encoding="utf-8") as f:
    private_key = f.read()

with open("cloudfront_public_key.pem", "r", encoding="utf-8") as f:
    public_key = f.read()

print(json.dumps({
    "private_key": private_key,
    "public_key": public_key,
    "key_pair_id": "${KEY_PAIR_ID}"
}))
PY
)"

echo ""
echo "Done."
echo "Secret updated successfully."
