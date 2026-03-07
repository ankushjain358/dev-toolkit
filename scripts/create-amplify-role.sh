#!/bin/bash

# Create IAM Role for AWS Amplify
ROLE_NAME="AmplifyServiceRole"

# Create trust policy for Amplify
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the IAM role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://trust-policy.json

# Attach AdministratorAccess-Amplify managed policy
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo "✅ IAM Role created successfully!"
echo "Role Name: $ROLE_NAME"
echo "Role ARN: $ROLE_ARN"

# Cleanup
rm trust-policy.json