import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  access: (allow) => [
    allow.authenticated().to(['invoke']).on('arn:aws:lambda:ap-northeast-2:533267442321:function:lambda-robo-controller-for-robo'),
  ],
});
