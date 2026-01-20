#!/usr/bin/env bash
set -e

PRIVATE_KEY="bootstrap_private.pem"
PUBLIC_KEY="bootstrap_public.pem"

echo "Generating CloudFront key pair..."

# Generate private key
openssl genrsa -out "$PRIVATE_KEY" 2048

# Generate public key
openssl rsa -pubout -in "$PRIVATE_KEY" -out "$PUBLIC_KEY"

echo ""
echo "Done."
echo ""
echo "Private key: $PRIVATE_KEY"
echo "Public key:  $PUBLIC_KEY"
echo ""
echo "Next step:"
echo "Open $PUBLIC_KEY and paste its contents into:"
echo "  CloudFrontPublicKey -> EncodedKey"
echo ""
