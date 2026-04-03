#!/usr/bin/env bash
set -euo pipefail

REGION="eu-west-2"

PRIVATE_KEY_FILE="cloudfront_private_key.pem"
PUBLIC_KEY_FILE="cloudfront_public_key.pem"
PUBKEY_CONFIG_FILE="$(mktemp)"
KEYGROUP_CONFIG_FILE="$(mktemp)"

# Change these if your CloudFormation logical IDs are different
SECRET_LOGICAL_ID="CloudFrontKeysSecret"
KEY_GROUP_LOGICAL_ID="CloudFrontKeyGroup"

cleanup() {
  rm -f "$PUBKEY_CONFIG_FILE" "$KEYGROUP_CONFIG_FILE"
}
trap cleanup EXIT

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_command aws
require_command openssl
require_command python3

echo "=== CloudFront key rotation helper ==="
echo ""

read -rp "Stack name (e.g. breadcrumb-stack-test): " STACK_NAME
read -rp "CloudFront public key name prefix (e.g. breadcrumb-public-key): " KEY_NAME_PREFIX

echo ""
read -rp "Also keep the existing public keys in the Key Group? [Y/n]: " KEEP_OLD_KEYS
KEEP_OLD_KEYS="${KEEP_OLD_KEYS:-Y}"

TIMESTAMP="$(date +%Y%m%d%H%M%S)"
KEY_NAME="${KEY_NAME_PREFIX}-${TIMESTAMP}"
CALLER_REFERENCE="${KEY_NAME}-${TIMESTAMP}"

echo ""
echo "Generating new RSA 2048 key pair..."
openssl genrsa -out "$PRIVATE_KEY_FILE" 2048 >/dev/null 2>&1
openssl rsa -pubout -in "$PRIVATE_KEY_FILE" -out "$PUBLIC_KEY_FILE" >/dev/null 2>&1
chmod 600 "$PRIVATE_KEY_FILE"

echo "Private key written to: $PRIVATE_KEY_FILE"
echo "Public key written to:  $PUBLIC_KEY_FILE"
echo ""

echo "Looking up Secrets Manager secret from CloudFormation..."
SECRET_ID="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --logical-resource-id "$SECRET_LOGICAL_ID" \
  --region "$REGION" \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"

if [[ -z "$SECRET_ID" || "$SECRET_ID" == "None" ]]; then
  echo "Could not find secret resource '$SECRET_LOGICAL_ID' in stack '$STACK_NAME'."
  exit 1
fi

echo "Found secret: $SECRET_ID"
echo ""

echo "Looking up CloudFront Key Group from CloudFormation..."
KEY_GROUP_ID="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --logical-resource-id "$KEY_GROUP_LOGICAL_ID" \
  --region "$REGION" \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"

if [[ -z "$KEY_GROUP_ID" || "$KEY_GROUP_ID" == "None" ]]; then
  echo "Could not find key group resource '$KEY_GROUP_LOGICAL_ID' in stack '$STACK_NAME'."
  echo "If your logical ID is different, change KEY_GROUP_LOGICAL_ID in this script."
  exit 1
fi

echo "Found key group: $KEY_GROUP_ID"
echo ""

echo "Creating new CloudFront public key..."
python3 - <<PY
import json

with open("${PUBLIC_KEY_FILE}", "r", encoding="utf-8") as f:
    public_key = f.read()

config = {
    "CallerReference": "${CALLER_REFERENCE}",
    "Name": "${KEY_NAME}",
    "Comment": "Rotated automatically on ${TIMESTAMP}",
    "EncodedKey": public_key
}

with open("${PUBKEY_CONFIG_FILE}", "w", encoding="utf-8") as f:
    json.dump(config, f)
PY

NEW_PUBLIC_KEY_ID="$(aws cloudfront create-public-key \
  --public-key-config "file://${PUBKEY_CONFIG_FILE}" \
  --query 'PublicKey.Id' \
  --output text)"

if [[ -z "$NEW_PUBLIC_KEY_ID" || "$NEW_PUBLIC_KEY_ID" == "None" ]]; then
  echo "Failed to create CloudFront public key."
  exit 1
fi

echo "Created CloudFront public key: $NEW_PUBLIC_KEY_ID"
echo ""

echo "Fetching current Key Group config and ETag..."
KEY_GROUP_ETAG="$(aws cloudfront get-key-group-config \
  --id "$KEY_GROUP_ID" \
  --query 'ETag' \
  --output text)"

if [[ -z "$KEY_GROUP_ETAG" || "$KEY_GROUP_ETAG" == "None" ]]; then
  echo "Failed to get Key Group ETag."
  exit 1
fi

EXISTING_KEYS_RAW="$(aws cloudfront get-key-group-config \
  --id "$KEY_GROUP_ID" \
  --query 'KeyGroupConfig.Items' \
  --output json)"

KEY_GROUP_NAME="$(aws cloudfront get-key-group-config \
  --id "$KEY_GROUP_ID" \
  --query 'KeyGroupConfig.Name' \
  --output text)"

KEY_GROUP_COMMENT="$(aws cloudfront get-key-group-config \
  --id "$KEY_GROUP_ID" \
  --query 'KeyGroupConfig.Comment' \
  --output text)"

if [[ "$KEY_GROUP_COMMENT" == "None" ]]; then
  KEY_GROUP_COMMENT=""
fi

echo "Updating Key Group..."
python3 - <<PY
import json

existing = json.loads('''${EXISTING_KEYS_RAW}''')
new_key = "${NEW_PUBLIC_KEY_ID}"
keep_old = "${KEEP_OLD_KEYS}".strip().lower() not in ("n", "no")

items = list(existing) if keep_old and existing is not None else []
if new_key not in items:
    items.append(new_key)

config = {
    "Name": "${KEY_GROUP_NAME}",
    "Comment": "${KEY_GROUP_COMMENT}",
    "Items": items
}

with open("${KEYGROUP_CONFIG_FILE}", "w", encoding="utf-8") as f:
    json.dump(config, f)
PY

aws cloudfront update-key-group \
  --id "$KEY_GROUP_ID" \
  --if-match "$KEY_GROUP_ETAG" \
  --key-group-config "file://${KEYGROUP_CONFIG_FILE}" \
  >/dev/null

echo "Key Group updated successfully."
echo ""

echo "Updating Secrets Manager secret..."
SECRET_JSON="$(python3 - <<PY
import json

with open("${PRIVATE_KEY_FILE}", "r", encoding="utf-8") as f:
    private_key = f.read()

with open("${PUBLIC_KEY_FILE}", "r", encoding="utf-8") as f:
    public_key = f.read()

print(json.dumps({
    "private_key": private_key,
    "public_key": public_key,
    "key_pair_id": "${NEW_PUBLIC_KEY_ID}"
}))
PY
)"

aws secretsmanager put-secret-value \
  --region "$REGION" \
  --secret-id "$SECRET_ID" \
  --secret-string "$SECRET_JSON" \
  >/dev/null

echo ""
echo "Done."
echo "New CloudFront public key ID: $NEW_PUBLIC_KEY_ID"
echo "Updated key group ID:          $KEY_GROUP_ID"
echo "Updated secret:                $SECRET_ID"
echo ""
echo "Local files created:"
echo "  $PRIVATE_KEY_FILE"
echo "  $PUBLIC_KEY_FILE"