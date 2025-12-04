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
  const email = event.request.userAttributes.email;
  const sub = event.request.userAttributes.sub;
  const userList = await client.models.Users.listUsersByEmail({ email });
  const userExists = userList?.data?.length > 0;

  if (userExists) {
    const existingUser = userList.data[0];
    if (existingUser.cognito_subs.indexOf(sub) == -1) {
      existingUser.cognito_subs.push(sub);
      await client.models.Users.update({
        id: existingUser.id,
        cognito_subs: existingUser.cognito_subs,
      });
    }
  } else {
    await client.models.Users.create({
      id: event.request.userAttributes.sub,
      email: event.request.userAttributes.email,
      cognito_subs: [event.request.userAttributes.sub],
    });
  }

  return event;
};
