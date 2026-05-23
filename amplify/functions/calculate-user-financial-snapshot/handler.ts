import type { Schema } from '../../data/resource';
import { getDataClient } from '../_shared/dataClient';
import { getSignedInUser } from '../_shared/event';
import { calculateUserFinancialSnapshot as calculateSnapshot } from '../_shared/snapshot';

export const handler: Schema['calculateUserFinancialSnapshot']['functionHandler'] = async (event) => {
  const user = getSignedInUser(event);
  const client = await getDataClient();

  return calculateSnapshot({
    client,
    owner: user.username,
    ownerSub: user.sub,
  });
};
