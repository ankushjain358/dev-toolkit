import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib/core";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});

// Add bucket policy in storage stack to avoid circular dependency
backend.storage.resources.bucket.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
    actions: ["s3:GetObject"],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`],
    conditions: {
      StringLike: {
        "AWS:SourceArn": `arn:aws:cloudfront::${Stack.of(backend.storage.resources.bucket).account}:distribution/*`,
      },
    },
  }),
);

const customStack = backend.createStack("CustomStack");

customStack.addDependency(Stack.of(backend.storage.resources.bucket));

const s3Bucket = s3.Bucket.fromBucketArn(
  customStack,
  "app-bucket",
  backend.storage.resources.bucket.bucketArn,
);

// For defaultBehavior, uses a dummy origin that will return errors for any request not matching /public/*
const distribution = new cloudfront.Distribution(
  customStack,
  "CloudFrontDistribution",
  {
    defaultBehavior: {
      origin: new origins.HttpOrigin("example.com"),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
    additionalBehaviors: {
      "/public/*": {
        origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    },
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 404,
        responsePagePath: "/404.html",
      },
    ],
  },
);

backend.addOutput({
  custom: {
    distributionDomainName: distribution.distributionDomainName,
  },
});
