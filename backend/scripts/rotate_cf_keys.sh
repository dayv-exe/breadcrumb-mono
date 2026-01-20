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

echo "Rotating CloudFront signing keys..."

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT

PRIVATE_KEY_PATH="${WORKDIR}/cloudfront_private_key.pem"
PUBLIC_KEY_PATH="${WORKDIR}/cloudfront_public_key.pem"

openssl genrsa -out "${PRIVATE_KEY_PATH}" 2048 >/dev/null 2>&1
openssl rsa -pubout -in "${PRIVATE_KEY_PATH}" -out "${PUBLIC_KEY_PATH}" >/dev/null 2>&1

NEW_PUBLIC_KEY_PEM="$(cat "${PUBLIC_KEY_PATH}")"
NEW_PRIVATE_KEY_PEM="$(cat "${PRIVATE_KEY_PATH}")"

GET_RES_JSON="$(aws cloudfront get-public-key --id "${CF_PUBLIC_KEY_ID}")"

ETAG="$(python3 - <<'PY'
import json, sys
data=json.loads(sys.stdin.read())
print(data["ETag"])
PY
<<< "${GET_RES_JSON}")"

CONFIG_JSON="$(python3 - <<'PY'
import json, sys
data=json.loads(sys.stdin.read())
print(json.dumps(data["PublicKey"]["PublicKeyConfig"]))
PY
<<< "${GET_RES_JSON}")"

UPDATED_CONFIG_JSON="$(python3 - <<'PY'
import json, sys
cfg=json.loads(sys.stdin.read())
new_key = sys.argv[1]
cfg["EncodedKey"] = new_key
print(json.dumps(cfg))
PY
"${NEW_PUBLIC_KEY_PEM}"
<<< "${CONFIG_JSON}")"

aws cloudfront update-public-key \
  --id "${CF_PUBLIC_KEY_ID}" \
  --if-match "${ETAG}" \
  --public-key-config "${UPDATED_CONFIG_JSON}" \
  >/dev/null

PRIVATE_ESCAPED="$(python3 - <<'PY'
import sys
s=sys.stdin.read().replace("\r\n","\n").replace("\n","\\n")
print(s)
PY
<<< "${NEW_PRIVATE_KEY_PEM}")"

PUBLIC_ESCAPED="$(python3 - <<'PY'
import sys
s=sys.stdin.read().replace("\r\n","\n").replace("\n","\\n")
print(s)
PY
<<< "${NEW_PUBLIC_KEY_PEM}")"

SECRET_JSON="$(cat <<EOF
{"private_key":"${PRIVATE_ESCAPED}","public_key":"${PUBLIC_ESCAPED}","key_pair_id":"${CF_PUBLIC_KEY_ID}"}
EOF
)"

aws secretsmanager put-secret-value \
  --region "${REGION}" \
  --secret-id "${SECRET_ID}" \
  --secret-string "${SECRET_JSON}" \
  >/dev/null

echo "Done. Keys rotated + secret updated."
