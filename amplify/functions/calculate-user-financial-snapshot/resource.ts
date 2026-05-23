import { defineFunction } from '@aws-amplify/backend';

export const calculateUserFinancialSnapshot = defineFunction({
  name: 'calculate-user-financial-snapshot',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
});
