import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

// Reference: https://docs.amplify.aws/react/build-a-backend/functions/environment-variables-and-secrets/
// When you configure your function with environment variables or secrets in defineFunction,
// Amplify's backend tooling generates a file using the function's name in .amplify/generated with references to your environment variables
// Which you can access from here via env
import { env } from "$amplify/env/post-confirmation";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const sub = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;

  // Check if profile already exists
  const { data: existingProfile } = await client.models.Profile.get({
    userId: sub,
  });

  if (!existingProfile) {
    // Extract display name from email (part before @)
    const displayName = email.split("@")[0];

    // Create profile entry for new user
    await client.models.Profile.create({
      userId: sub,
      displayName: displayName,
    });
  }

  return event;
};
