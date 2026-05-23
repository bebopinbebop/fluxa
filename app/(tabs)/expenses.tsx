import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow } from '../../src/components/TransactionRow';
import { InsightCard } from '../../src/components/InsightCard';
import { BankDataPlaceholder } from '../../src/components/BankDataPlaceholder';
import { usePullToRefresh } from '../../src/components/PullToRefresh';
import { useAuth } from '../../src/auth/useAuth';
import { formatCurrency } from '../../src/lib/financials';
import {
  detectRecurringSubscriptions,
  getIncomeExpenseSummary,
  getRecentTransactions,
  getSpendingByCategory,
  getTotalSpendingByMonth,
  identifyHighSpendingCategories,
} from '../../src/lib/transactions';

const ranges = ['7 Day', '30 Day', '90 Day', '360 Day'] as const;

export default function ExpensesScreen() {
  const pullToRefresh = usePullToRefresh();
  const { hasConnectedBank, transactions } = useAuth();
  const recentTransactions = getRecentTransactions(transactions, 4);
  const spendingByCategory = getSpendingByCategory(transactions);
  const highCategories = identifyHighSpendingCategories(transactions, 1);
  const subscriptions = detectRecurringSubscriptions(transactions);
  const cashFlow = getIncomeExpenseSummary(transactions);
  const aprilSpending = getTotalSpendingByMonth(transactions, '2026-04');
  const topCategory = highCategories[0];
  const topSubscription = subscriptions[0];

  return (
    <View style={styles.screen}>
      {pullToRefresh.indicator}
      <ScrollView
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={styles.container}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
      >
        <Text style={styles.header}>Your <Text style={{ color: Colors.blue }}>Expenses</Text></Text>

      <View style={styles.pills}>
        {ranges.map((r, i) => (
          <Pressable key={r} style={[styles.pill, i === 0 && styles.pillActive]}>
            <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={{ fontWeight: '700' }}>April spending by category</Text>
        {hasConnectedBank ? (
          <View style={styles.fakeChart}>
            {spendingByCategory.slice(0, 5).map((item) => (
              <View key={item.category} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>{item.category.replaceAll('_', ' ')}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, (item.amount / Math.max(aprilSpending, 1)) * 100)}%` }]} />
                </View>
                <Text style={styles.barAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.placeholderWrap}>
            <BankDataPlaceholder compact />
          </View>
        )}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.link}>See all</Text>
      </View>

      <View style={{ gap: 10 }}>
        {hasConnectedBank ? (
          recentTransactions.map((transaction) => (
            <TransactionRow key={transaction.transaction_id} txn={transaction} />
          ))
        ) : (
          <BankDataPlaceholder compact />
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Analysis</Text>

      {hasConnectedBank ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
          <InsightCard title="Expense Categories" subtitle={`${formatCurrency(aprilSpending)} spent in April`} tone="blue" cta="See More" />
          <InsightCard title="Cash Flow" subtitle={`${formatCurrency(cashFlow.net)} net`} tone={cashFlow.net >= 0 ? 'green' : 'red'} cta="See More" />
          <InsightCard
            title="Recurring Transactions"
            subtitle={topSubscription ? `${topSubscription.merchantName} ${formatCurrency(topSubscription.amount)}` : 'No recurring subscriptions found'}
            tone="red"
            cta="See all"
          />
          <InsightCard
            title="High Spending"
            subtitle={topCategory ? `${topCategory.category.replaceAll('_', ' ')} leads spending` : 'No high-spend category yet'}
            tone="blue"
            cta="Review"
          />
          <InsightCard title="Make a budget" subtitle="Help yourself with a budget" tone="blue" cta="See all" />
        </ScrollView>
      ) : (
        <BankDataPlaceholder compact />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 16, paddingTop: 18, paddingBottom: 30 },
  header: { fontSize: 20, fontWeight: '800' },
  pills: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#eee' },
  pillActive: { backgroundColor: Colors.blue },
  pillText: { fontWeight: '600', color: '#333' },
  pillTextActive: { color: '#fff' },
  chartCard: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14 },
  fakeChart: { minHeight: 160, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', gap: 10, padding: 12 },
  placeholderWrap: { marginTop: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 92, color: Colors.muted, fontSize: 11, fontWeight: '800' },
  barTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: '#EEF2FF', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999, backgroundColor: Colors.blue },
  barAmount: { width: 76, textAlign: 'right', fontSize: 11, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  link: { color: Colors.muted }
});
