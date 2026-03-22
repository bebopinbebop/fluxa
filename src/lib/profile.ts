import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type UserProfile = Schema['UserProfile']['type'];

export type CreateMyProfileInput = {
  email: string;
  firstName: string;
  ageRange: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  riskTolerance: string;
};

export async function getMyProfile() {
  const { data } = await client.models.UserProfile.list();
  return data?.[0] ?? null;
}

export async function createMyProfile(input: CreateMyProfileInput) {
  const { data, errors } = await client.models.UserProfile.create({
    ...input,
    onboardingComplete: true,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? null;
}

export async function deleteMyProfile() {
  const { data } = await client.models.UserProfile.list();

  if (!data?.[0]?.id) {
    return;
  }

  const { errors } = await client.models.UserProfile.delete({ id: data[0].id });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }
}
