import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      email: a.email().required(),
      firstName: a.string(),
      ageRange: a.string(),
      monthlyIncome: a.float(),
      monthlyExpenses: a.float(),
      riskTolerance: a.string(),
      totalAssets: a.float(),
      totalLiabilities: a.float(),
      totalNetWorth: a.float(),
      onboardingComplete: a.boolean().required(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
