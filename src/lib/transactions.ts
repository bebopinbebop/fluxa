import type { Transaction } from '../types/transaction';

export type TransactionFilters = {
  category?: string | null;
  fromDate?: string | null;
  query?: string | null;
  toDate?: string | null;
};

export type CategorySpending = {
  category: string;
  amount: number;
  transactionCount: number;
};

export type RecurringSubscription = {
  merchantName: string;
  amount: number;
  occurrences: number;
  latestDate: string;
};

export function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => right.date.localeCompare(left.date));
}

export function getRecentTransactions(transactions: Transaction[], limit = 5) {
  return sortTransactions(transactions).slice(0, limit);
}

export function getTransactionPrimaryCategory(transaction: Transaction) {
  return transaction.personal_finance_category.primary || transaction.category[0] || 'OTHER';
}

export function getTransactionDisplayMerchant(transaction: Transaction) {
  return transaction.merchant_name || transaction.counterparties[0]?.name || transaction.name;
}

export function getTransactionSignedDisplayAmount(transaction: Transaction) {
  return transaction.amount > 0 ? -transaction.amount : Math.abs(transaction.amount);
}

export function isExpense(transaction: Transaction) {
  return transaction.amount > 0 && !getTransactionPrimaryCategory(transaction).startsWith('TRANSFER');
}

export function isIncome(transaction: Transaction) {
  return transaction.amount < 0 || getTransactionPrimaryCategory(transaction) === 'INCOME';
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const normalizedCategory = filters.category?.trim().toUpperCase();

  return sortTransactions(transactions).filter((transaction) => {
    const merchant = getTransactionDisplayMerchant(transaction).toLowerCase();
    const name = transaction.name.toLowerCase();
    const primaryCategory = getTransactionPrimaryCategory(transaction).toUpperCase();

    const matchesQuery = !normalizedQuery || merchant.includes(normalizedQuery) || name.includes(normalizedQuery);
    const matchesCategory = !normalizedCategory || primaryCategory === normalizedCategory;
    const matchesFromDate = !filters.fromDate || transaction.date >= filters.fromDate;
    const matchesToDate = !filters.toDate || transaction.date <= filters.toDate;

    return matchesQuery && matchesCategory && matchesFromDate && matchesToDate;
  });
}

export function getTransactionsForMonth(transactions: Transaction[], yearMonth: string) {
  return transactions.filter((transaction) => transaction.date.startsWith(yearMonth));
}

export function getTotalSpendingByMonth(transactions: Transaction[], yearMonth: string) {
  return roundCurrency(
    getTransactionsForMonth(transactions, yearMonth)
      .filter(isExpense)
      .reduce((total, transaction) => total + transaction.amount, 0)
  );
}

export function getSpendingByCategory(transactions: Transaction[]) {
  const totals = transactions.filter(isExpense).reduce<Record<string, CategorySpending>>((acc, transaction) => {
    const category = getTransactionPrimaryCategory(transaction);
    const existing = acc[category] ?? { category, amount: 0, transactionCount: 0 };

    acc[category] = {
      ...existing,
      amount: roundCurrency(existing.amount + transaction.amount),
      transactionCount: existing.transactionCount + 1,
    };

    return acc;
  }, {});

  return Object.values(totals).sort((left, right) => right.amount - left.amount);
}

export function detectRecurringSubscriptions(transactions: Transaction[]) {
  const merchantGroups = transactions.filter(isExpense).reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const merchant = getTransactionDisplayMerchant(transaction);
    acc[merchant] = [...(acc[merchant] ?? []), transaction];
    return acc;
  }, {});

  return Object.entries(merchantGroups)
    .map(([merchantName, merchantTransactions]): RecurringSubscription | null => {
      const sorted = sortTransactions(merchantTransactions);
      const matchingAmounts = new Set(sorted.map((transaction) => transaction.amount.toFixed(2)));
      const hasSubscriptionCategory = sorted.some((transaction) =>
        transaction.category.some((category) => category.toLowerCase().includes('subscription'))
      );

      if (sorted.length < 2 || matchingAmounts.size > 1 || !hasSubscriptionCategory) {
        return null;
      }

      return {
        merchantName,
        amount: sorted[0].amount,
        occurrences: sorted.length,
        latestDate: sorted[0].date,
      };
    })
    .filter((subscription): subscription is RecurringSubscription => Boolean(subscription))
    .sort((left, right) => right.amount - left.amount);
}

export function identifyHighSpendingCategories(transactions: Transaction[], limit = 3) {
  return getSpendingByCategory(transactions).slice(0, limit);
}

export function getPendingPostedSummary(transactions: Transaction[]) {
  const pending = transactions.filter((transaction) => transaction.pending);
  const posted = transactions.filter((transaction) => !transaction.pending);

  return {
    pendingCount: pending.length,
    pendingAmount: roundCurrency(pending.reduce((total, transaction) => total + Math.max(transaction.amount, 0), 0)),
    postedCount: posted.length,
    postedAmount: roundCurrency(posted.reduce((total, transaction) => total + Math.max(transaction.amount, 0), 0)),
  };
}

export function getIncomeExpenseSummary(transactions: Transaction[]) {
  const income = transactions.filter(isIncome).reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const expenses = transactions.filter(isExpense).reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income: roundCurrency(income),
    expenses: roundCurrency(expenses),
    net: roundCurrency(income - expenses),
  };
}

export function getAvailableCategories(transactions: Transaction[]) {
  return Array.from(new Set(transactions.map(getTransactionPrimaryCategory))).sort();
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
