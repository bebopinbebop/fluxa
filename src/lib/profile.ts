import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { buildFinancialTotalsPatch } from './financials';

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
    ...buildFinancialTotalsPatch(),
    onboardingComplete: true,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? null;
}

function numbersMatch(left?: number | null, right?: number | null) {
  return Number((left ?? 0).toFixed(2)) === Number((right ?? 0).toFixed(2));
}

export async function syncMyProfileFinancials(profile: UserProfile | null) {
  if (!profile?.id) {
    return profile;
  }

  const patch = buildFinancialTotalsPatch();
  const needsUpdate =
    !numbersMatch(profile.totalAssets, patch.totalAssets) ||
    !numbersMatch(profile.totalLiabilities, patch.totalLiabilities) ||
    !numbersMatch(profile.totalNetWorth, patch.totalNetWorth);

  if (!needsUpdate) {
    return profile;
  }

  const { data, errors } = await client.models.UserProfile.update({
    id: profile.id,
    ...patch,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? { ...profile, ...patch };
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
