import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { logAwsTableAccess } from './awsDataLog';
import { buildFinancialTotalsPatch } from './financials';

const client = generateClient<Schema>();

export type UserProfile = Schema['UserProfile']['type'];

export type CreateMyProfileInput = {
  email: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  profileImageKey?: string | null;
  originalProfileImageKey?: string | null;
};

export type UpdateMyProfileInput = {
  id: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  profileImageKey?: string | null;
  originalProfileImageKey?: string | null;
};

export async function getMyProfile() {
  logAwsTableAccess('UserProfile', 'list');
  const { data } = await client.models.UserProfile.list();
  return data?.[0] ?? null;
}

export async function createMyProfile(input: CreateMyProfileInput) {
  logAwsTableAccess('UserProfile', 'create');
  const { data, errors } = await client.models.UserProfile.create({
    ...input,
    firstName: getFirstName(input.name),
    ...buildFinancialTotalsPatch(),
    onboardingComplete: true,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? null;
}

export async function updateMyProfile(input: UpdateMyProfileInput) {
  logAwsTableAccess('UserProfile', 'update');
  const { data, errors } = await client.models.UserProfile.update({
    ...input,
    firstName: getFirstName(input.name),
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
  const hasExistingFinancials =
    profile.totalAssets !== null &&
    profile.totalAssets !== undefined &&
    profile.totalLiabilities !== null &&
    profile.totalLiabilities !== undefined &&
    profile.totalNetWorth !== null &&
    profile.totalNetWorth !== undefined;

  if (hasExistingFinancials) {
    return profile;
  }

  const needsUpdate =
    !numbersMatch(profile.totalAssets, patch.totalAssets) ||
    !numbersMatch(profile.totalLiabilities, patch.totalLiabilities) ||
    !numbersMatch(profile.totalNetWorth, patch.totalNetWorth);

  if (!needsUpdate) {
    return profile;
  }

  logAwsTableAccess('UserProfile', 'update');
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
  logAwsTableAccess('UserProfile', 'list');
  const { data } = await client.models.UserProfile.list();

  if (!data?.[0]?.id) {
    return;
  }

  logAwsTableAccess('UserProfile', 'delete');
  const { errors } = await client.models.UserProfile.delete({ id: data[0].id });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name.trim();
}
