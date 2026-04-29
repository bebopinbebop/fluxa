import type { UserProfile } from './profile';
import { Colors } from '../theme/colors';

export type FinancialTone = 'green' | 'red';

export type FinancialCategory = {
  title: string;
  amount: number;
  tone: FinancialTone;
  details?: string[];
};

export const assetCategories: FinancialCategory[] = [
  {
    title: 'Cash',
    amount: 40159.53,
    tone: 'green',
    details: [
      'Checking • $2,300.23 • 386492731324',
      'Savings • $10,233.38 • 239137402132',
      'Checking • $27,625.92 • 203817482291',
    ],
  },
  { title: 'Investments', amount: 54762.0, tone: 'green' },
  { title: 'Life Insurance', amount: 36508.64, tone: 'green' },
  { title: 'Real Estate', amount: 38334.97, tone: 'green' },
  { title: 'Other', amount: 12778.18, tone: 'green' },
];

export const liabilityCategories: FinancialCategory[] = [
  { title: 'Credit', amount: 33786.42, tone: 'red' },
  { title: 'Lease', amount: 0, tone: 'green' },
  { title: 'Mortgages', amount: 47007.18, tone: 'red' },
  { title: 'Loans', amount: 44069.24, tone: 'red' },
  { title: 'Other', amount: 22034.61, tone: 'red' },
];

function sumAmounts(categories: FinancialCategory[]) {
  return Number(categories.reduce((total, category) => total + category.amount, 0).toFixed(2));
}

export function calculateFinancialTotals() {
  const totalAssets = sumAmounts(assetCategories);
  const totalLiabilities = sumAmounts(liabilityCategories);
  const totalNetWorth = Number((totalAssets - totalLiabilities).toFixed(2));

  return {
    totalAssets,
    totalLiabilities,
    totalNetWorth,
  };
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCategoryAmount(amount: number, sign: 'positive' | 'negative' = 'positive') {
  const value = sign === 'negative' ? -Math.abs(amount) : amount;
  return formatCurrency(value);
}

export function getFinancialToneColor(tone: FinancialTone) {
  return tone === 'green' ? Colors.green : Colors.red;
}

export function buildFinancialTotalsPatch() {
  return calculateFinancialTotals();
}

export function getProfileFinancialTotals(profile?: UserProfile | null) {
  const defaults = calculateFinancialTotals();

  return {
    totalAssets: profile?.totalAssets ?? defaults.totalAssets,
    totalLiabilities: profile?.totalLiabilities ?? defaults.totalLiabilities,
    totalNetWorth: profile?.totalNetWorth ?? defaults.totalNetWorth,
  };
}
