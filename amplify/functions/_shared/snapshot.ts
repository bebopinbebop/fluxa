import { logAwsTableAccess } from './dataLog';

type DataClient = any;

type SnapshotInput = {
  client: DataClient;
  owner: string;
  ownerSub: string;
};

type CategoryTotal = {
  category: string;
  amount: number;
};

export async function calculateUserFinancialSnapshot({ client, owner, ownerSub }: SnapshotInput) {
  console.log('[PlaidFlow][Snapshot] start', {
    ownerSub,
    owner,
  });

  logAwsTableAccess('PlaidAccount', 'listPlaidAccountByOwnerSub');
  logAwsTableAccess('PlaidTransaction', 'listPlaidTransactionByOwnerSub');
  logAwsTableAccess('PlaidItem', 'listPlaidItemByOwnerSub');
  const [accountResult, transactionResult, itemResult] = await Promise.all([
    client.models.PlaidAccount.listPlaidAccountByOwnerSub({ ownerSub }),
    client.models.PlaidTransaction.listPlaidTransactionByOwnerSub({ ownerSub }),
    client.models.PlaidItem.listPlaidItemByOwnerSub({ ownerSub }),
  ]);

  const accounts = (accountResult.data ?? []).filter(Boolean);
  const transactions = (transactionResult.data ?? []).filter((transaction: any) => transaction && !transaction.removed);
  const items = (itemResult.data ?? []).filter(Boolean);

  console.log('[PlaidFlow][Snapshot] source data loaded', {
    ownerSub,
    accountCount: accounts.length,
    transactionCount: transactions.length,
    itemCount: items.length,
  });

  const latestTransactionDate = getLatestTransactionDate(transactions);
  const monthPrefix = latestTransactionDate ? latestTransactionDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter((transaction: any) => transaction.date?.startsWith(monthPrefix));
  const expenseTransactions = monthlyTransactions.filter(isExpenseTransaction);
  const incomeTransactions = monthlyTransactions.filter(isIncomeTransaction);
  const monthlyIncome = roundCurrency(
    incomeTransactions.reduce((total: number, transaction: any) => total + Math.abs(transaction.amount ?? 0), 0)
  );
  const monthlyExpenses = roundCurrency(
    expenseTransactions.reduce((total: number, transaction: any) => total + Math.abs(transaction.amount ?? 0), 0)
  );
  const monthlyCashFlow = roundCurrency(monthlyIncome - monthlyExpenses);
  const savingsRate = monthlyIncome > 0 ? roundCurrency((monthlyCashFlow / monthlyIncome) * 100) : 0;
  const { totalAssets, totalLiabilities } = calculateBalanceTotals(accounts);
  const topCategory = getTopSpendingCategory(expenseTransactions);
  const recurringSubscriptionCount = countRecurringSubscriptions(transactions);
  const snapshotInput = {
    owner,
    ownerSub,
    totalAssets,
    totalLiabilities,
    totalNetWorth: roundCurrency(totalAssets - totalLiabilities),
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow,
    savingsRate,
    topSpendingCategory: topCategory?.category ?? null,
    topSpendingCategoryAmount: topCategory?.amount ?? 0,
    recurringSubscriptionCount,
    connectedInstitutionCount: new Set(items.map((item: any) => item.institution_id).filter(Boolean)).size,
    connectedAccountCount: accounts.length,
    transactionCount: transactions.length,
    pendingTransactionCount: transactions.filter((transaction: any) => Boolean(transaction.pending)).length,
    lastTransactionDate: latestTransactionDate,
    calculatedAt: new Date().toISOString(),
  };

  console.log('[PlaidFlow][Snapshot] calculated values', {
    ownerSub,
    totalAssets: snapshotInput.totalAssets,
    totalLiabilities: snapshotInput.totalLiabilities,
    totalNetWorth: snapshotInput.totalNetWorth,
    monthlyIncome: snapshotInput.monthlyIncome,
    monthlyExpenses: snapshotInput.monthlyExpenses,
    monthlyCashFlow: snapshotInput.monthlyCashFlow,
    savingsRate: snapshotInput.savingsRate,
    topSpendingCategory: snapshotInput.topSpendingCategory,
    connectedAccountCount: snapshotInput.connectedAccountCount,
    transactionCount: snapshotInput.transactionCount,
    pendingTransactionCount: snapshotInput.pendingTransactionCount,
  });

  logAwsTableAccess('UserFinancialSnapshot', 'listUserFinancialSnapshotByOwnerSub');
  const existing = await client.models.UserFinancialSnapshot.listUserFinancialSnapshotByOwnerSub({ ownerSub });
  const existingSnapshot = existing.data?.[0];
  let persistedSnapshot;

  if (existingSnapshot?.id) {
    logAwsTableAccess('UserFinancialSnapshot', 'update');
    persistedSnapshot = (await client.models.UserFinancialSnapshot.update({ id: existingSnapshot.id, ...snapshotInput })).data;
    console.log('[PlaidFlow][Snapshot] snapshot updated', {
      ownerSub,
      snapshotId: existingSnapshot.id,
    });
  } else {
    logAwsTableAccess('UserFinancialSnapshot', 'create');
    persistedSnapshot = (await client.models.UserFinancialSnapshot.create(snapshotInput)).data;
    console.log('[PlaidFlow][Snapshot] snapshot created', {
      ownerSub,
      snapshotId: persistedSnapshot?.id ?? null,
    });
  }

  await updateUserProfileFinancials(client, owner, snapshotInput);

  console.log('[PlaidFlow][Snapshot] complete', {
    ownerSub,
    snapshotId: persistedSnapshot?.id ?? null,
  });

  return persistedSnapshot ?? snapshotInput;
}

function calculateBalanceTotals(accounts: any[]) {
  return accounts.reduce(
    (totals, account) => {
      const balance = Number(account.current_balance ?? 0);
      const type = String(account.type ?? '').toLowerCase();

      if (type === 'credit' || type === 'loan') {
        totals.totalLiabilities += Math.abs(balance);
      } else {
        totals.totalAssets += balance;
      }

      return totals;
    },
    { totalAssets: 0, totalLiabilities: 0 }
  );
}

function getTopSpendingCategory(transactions: any[]): CategoryTotal | null {
  const totals = transactions.reduce<Record<string, number>>((acc, transaction) => {
    const category = transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? 'OTHER';
    acc[category] = (acc[category] ?? 0) + Math.abs(transaction.amount ?? 0);
    return acc;
  }, {});
  const [category, amount] = Object.entries(totals).sort((left, right) => right[1] - left[1])[0] ?? [];

  if (!category) {
    return null;
  }

  return { category, amount: roundCurrency(amount) };
}

function countRecurringSubscriptions(transactions: any[]) {
  const merchantAmounts = transactions.filter(isExpenseTransaction).reduce<Record<string, Set<string>>>((acc, transaction) => {
    const merchant = transaction.merchant_name ?? transaction.name;
    const isSubscription = (transaction.category ?? []).some((category: string) =>
      category.toLowerCase().includes('subscription')
    );

    if (!merchant || !isSubscription) {
      return acc;
    }

    acc[merchant] = acc[merchant] ?? new Set<string>();
    acc[merchant].add(Number(transaction.amount ?? 0).toFixed(2));
    return acc;
  }, {});

  return Object.values(merchantAmounts).filter((amounts) => amounts.size === 1).length;
}

function isExpenseTransaction(transaction: any) {
  const category = String(transaction.personal_finance_category?.primary ?? '').toUpperCase();
  return Number(transaction.amount ?? 0) > 0 && !category.startsWith('TRANSFER');
}

function isIncomeTransaction(transaction: any) {
  const category = String(transaction.personal_finance_category?.primary ?? '').toUpperCase();
  return Number(transaction.amount ?? 0) < 0 || category === 'INCOME';
}

function getLatestTransactionDate(transactions: any[]) {
  return transactions
    .map((transaction) => transaction.date)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
}

async function updateUserProfileFinancials(client: DataClient, owner: string, snapshot: any) {
  logAwsTableAccess('UserProfile', 'list');
  const profiles = await client.models.UserProfile.list();
  const profile = profiles.data?.find((candidate: any) => candidate?.owner === owner);

  if (!profile?.id) {
    console.log('[PlaidFlow][Snapshot] no UserProfile found to update', {
      owner,
    });
    return;
  }

  logAwsTableAccess('UserProfile', 'update');
  await client.models.UserProfile.update({
    id: profile.id,
    monthlyIncome: snapshot.monthlyIncome,
    monthlyExpenses: snapshot.monthlyExpenses,
    totalAssets: snapshot.totalAssets,
    totalLiabilities: snapshot.totalLiabilities,
    totalNetWorth: snapshot.totalNetWorth,
  });

  console.log('[PlaidFlow][Snapshot] UserProfile financial fields updated', {
    owner,
    profileId: profile.id,
  });
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
