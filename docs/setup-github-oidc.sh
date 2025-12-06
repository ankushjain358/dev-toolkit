#!/bin/bash

set -e

# Automatically detect AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

PROVIDER_URL="token.actions.githubusercontent.com"
PROVIDER_THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"
ROLE_NAME="GithubOIDCAdminRole"

echo "Using AWS Account ID: ${ACCOUNT_ID}"
echo "Creating OIDC Provider..."

aws iam create-open-id-connect-provider \
  --url "https://${PROVIDER_URL}" \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list "${PROVIDER_THUMBPRINT}" \
  >/dev/null

OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${PROVIDER_URL}"
echo "OIDC Provider ARN: ${OIDC_ARN}"

echo "Generating trust-policy.json..."
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${OIDC_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:ankushjain358/dev-toolkit:*"
        }
      }
    }
  ]
}
EOF

echo "Creating IAM Role: ${ROLE_NAME}..."
aws iam create-role \
  --role-name "${ROLE_NAME}" \
  --assume-role-policy-document file://trust-policy.json \
  >/dev/null

echo "Attaching AdministratorAccess..."
aws iam attach-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \
  >/dev/null

echo "Done!"

echo -n "IAM Role ARN: "
aws iam get-role --role-name "${ROLE_NAME}" --query "Role.Arn" --output text
echo
