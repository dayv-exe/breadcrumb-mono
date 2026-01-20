#!/usr/bin/env bash
set -euo pipefail

STACK_NAME=""
REGION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack-name) STACK_NAME="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    *) echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [[ -z "${STACK_NAME}" || -z "${REGION}" ]]; then
  echo "Usage: $0 --stack-name <name> --region <region>" >&2
  exit 1
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need aws
need openssl
need python3

CF_PUBLIC_KEY_ID="$(aws cloudformation describe-stack-resource \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --logical-resource-id CloudFrontPublicKey \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"

SECRET_ID="$(aws cloudformation describe-stack-resource \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --logical-resource-id CloudFrontKeysSecret \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"

if [[ -z "${CF_PUBLIC_KEY_ID}" || "${CF_PUBLIC_KEY_ID}" == "None" ]]; then
  echo "CloudFrontPublicKey not found in stack." >&2
  exit 1
fi
if [[ -z "${SECRET_ID}" || "${SECRET_ID}" == "None" ]]; then
  echo "CloudFrontKeysSecret not found in stack." >&2
  exit 1
fi

CURRENT_SECRET_STRING="$(aws secretsmanager get-secret-value \
  --region "${REGION}" \
  --secret-id "${SECRET_ID}" \
  --query 'SecretString' \
  --output text 2>/dev/null || true)"

# If secret already contains a real private key, do nothing
if [[ -n "${CURRENT_SECRET_STRING}" && "${CURRENT_SECRET_STRING}" != "None" ]]; then
  if echo "${CURRENT_SECRET_STRING}" | grep -q "BEGIN RSA PRIVATE KEY"; then
    echo "Secret already initialized. Skipping."
    exit 0
  fi
  if echo "${CURRENT_SECRET_STRING}" | grep -q '"private_key"[[:space:]]*:[[:space:]]*".\+' \
    && ! echo "${CURRENT_SECRET_STRING}" | grep -q '"private_key"[[:space:]]*:[[:space:]]*""'; then
    echo "Secret already initialized (private_key non-empty). Skipping."
    exit 0
  fi
fi

echo "Initializing CloudFront signing keys and secret..."

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT

PRIVATE_KEY_PATH="${WORKDIR}/cloudfront_private_key.pem"
PUBLIC_KEY_PATH="${WORKDIR}/cloudfront_public_key.pem"

openssl genrsa -out "${PRIVATE_KEY_PATH}" 2048 >/dev/null 2>&1
openssl rsa -pubout -in "${PRIVATE_KEY_PATH}" -out "${PUBLIC_KEY_PATH}" >/dev/null 2>&1

NEW_PUBLIC_KEY_PEM="$(cat "${PUBLIC_KEY_PATH}")"
NEW_PRIVATE_KEY_PEM="$(cat "${PRIVATE_KEY_PATH}")"

GET_RES_JSON="$(aws cloudfront get-public-key --id "${CF_PUBLIC_KEY_ID}")"

ETAG="$(echo "${GET_RES_JSON}" | python3 -c '
import json, sys
data=json.loads(sys.stdin.read())
print(data["ETag"])
')"

CONFIG_JSON="$(echo "${GET_RES_JSON}" | python3 -c '
import json, sys
data=json.loads(sys.stdin.read())
print(json.dumps(data["PublicKey"]["PublicKeyConfig"]))
')"

UPDATED_CONFIG_JSON="$(python3 -c '
import json, sys
cfg=json.loads(sys.argv[1])
new_key = sys.argv[2]
cfg["EncodedKey"] = new_key
print(json.dumps(cfg))
' "${CONFIG_JSON}" "${NEW_PUBLIC_KEY_PEM}")"

aws cloudfront update-public-key \
  --id "${CF_PUBLIC_KEY_ID}" \
  --if-match "${ETAG}" \
  --public-key-config "${UPDATED_CONFIG_JSON}" \
  >/dev/null

PRIVATE_ESCAPED="$(echo "${NEW_PRIVATE_KEY_PEM}" | python3 -c '
import sys
s=sys.stdin.read().replace("\r\n","\n").replace("\n","\\n")
print(s)
')"

PUBLIC_ESCAPED="$(echo "${NEW_PUBLIC_KEY_PEM}" | python3 -c '
import sys
s=sys.stdin.read().replace("\r\n","\n").replace("\n","\\n")
print(s)
')"

SECRET_JSON="$(cat <<EOF
{"private_key":"${PRIVATE_ESCAPED}","public_key":"${PUBLIC_ESCAPED}","key_pair_id":"${CF_PUBLIC_KEY_ID}"}
EOF
)"

aws secretsmanager put-secret-value \
  --region "${REGION}" \
  --secret-id "${SECRET_ID}" \
  --secret-string "${SECRET_JSON}" \
  >/dev/null

echo "Done. Secret initialized."