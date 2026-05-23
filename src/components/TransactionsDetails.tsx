import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/useAuth';
import { formatCurrency } from '../lib/financials';
import {
  detectRecurringSubscriptions,
  filterTransactions,
  getAvailableCategories,
  getIncomeExpenseSummary,
  getPendingPostedSummary,
  getTotalSpendingByMonth,
  identifyHighSpendingCategories,
} from '../lib/transactions';
import { Colors } from '../theme/colors';
import { BankDataPlaceholder } from './BankDataPlaceholder';
import { CalendarDatePicker } from './CalendarDatePicker';
import { usePullToRefresh } from './PullToRefresh';
import { TransactionRow } from './TransactionRow';

const monthOptions = ['2026-05', '2026-04', '2026-03'] as const;

export function TransactionsDetails() {
  const pullToRefresh = usePullToRefresh();
  const { hasConnectedBank, transactions, transactionsLoading } = useAuth();
  const categories = getAvailableCategories(transactions);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-05-31');
  const [month, setMonth] = useState<(typeof monthOptions)[number]>('2026-04');

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, { query, category, fromDate, toDate }),
    [category, fromDate, query, toDate, transactions]
  );
  const monthSpend = getTotalSpendingByMonth(transactions, month);
  const cashFlow = getIncomeExpenseSummary(filteredTransactions);
  const pendingPosted = getPendingPostedSummary(filteredTransactions);
  const highCategories = identifyHighSpendingCategories(filteredTransactions, 2);
  const subscriptions = detectRecurringSubscriptions(transactions);

  return (
    <View style={styles.screen}>
      {pullToRefresh.indicator}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.transaction_id}
        renderItem={({ item }) => <TransactionRow txn={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.content}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
        ListHeaderComponent={
          <View style={styles.header}>
            {transactionsLoading ? <Text style={styles.loadingText}>Loading your transaction table...</Text> : null}

            {hasConnectedBank ? (
              <>
                <View style={styles.summaryGrid}>
                  <SummaryTile label={`${month} spending`} value={formatCurrency(monthSpend)} tone="red" />
                  <SummaryTile label="Income vs expenses" value={formatCurrency(cashFlow.net)} tone={cashFlow.net >= 0 ? 'green' : 'red'} />
                  <SummaryTile label="Pending" value={`${pendingPosted.pendingCount} - ${formatCurrency(pendingPosted.pendingAmount)}`} tone="blue" />
                  <SummaryTile label="Posted" value={`${pendingPosted.postedCount} - ${formatCurrency(pendingPosted.postedAmount)}`} tone="green" />
                </View>

                <View style={styles.months}>
                  {monthOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.pill, month === option && styles.pillActive]}
                      onPress={() => setMonth(option)}
                    >
                      <Text style={[styles.pillText, month === option && styles.pillTextActive]}>{option}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search merchant or transaction name"
                  placeholderTextColor={Colors.muted}
                  style={styles.input}
                />

                <View style={styles.dateRow}>
                  <CalendarDatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    placeholder="From date"
                    maximumDate={toDate}
                    style={[styles.input, styles.dateInput]}
                  />
                  <CalendarDatePicker
                    value={toDate}
                    onChange={setToDate}
                    placeholder="To date"
                    minimumDate={fromDate}
                    style={[styles.input, styles.dateInput]}
                  />
                </View>

                <FlatList
                  horizontal
                  data={['All', ...categories]}
                  keyExtractor={(item) => item}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryList}
                  renderItem={({ item }) => {
                    const active = item === 'All' ? !category : category === item;
                    return (
                      <Pressable style={[styles.pill, active && styles.pillActive]} onPress={() => setCategory(item === 'All' ? null : item)}>
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.replaceAll('_', ' ')}</Text>
                      </Pressable>
                    );
                  }}
                />

                <Text style={styles.sectionTitle}>Signals</Text>
                <View style={styles.signalCard}>
                  <Text style={styles.signalText}>
                    Top categories: {highCategories.map((item) => `${item.category.replaceAll('_', ' ')} ${formatCurrency(item.amount)}`).join(', ') || 'No expenses found'}
                  </Text>
                  <Text style={styles.signalText}>
                    Recurring: {subscriptions.map((item) => `${item.merchantName} ${formatCurrency(item.amount)}`).join(', ') || 'None detected'}
                  </Text>
                </View>
              </>
            ) : (
              <BankDataPlaceholder />
            )}

            <Text style={styles.sectionTitle}>Results</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{hasConnectedBank ? 'No transactions match these filters.' : 'Connect your bank for transactions.'}</Text>}
      />
    </View>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'blue' }) {
  const color = tone === 'green' ? Colors.green : tone === 'red' ? Colors.red : Colors.blue;
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingTop: 4, paddingBottom: 24 },
  header: { paddingBottom: 12 },
  loadingText: { color: Colors.muted, marginBottom: 12, fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryTile: { width: '48%', minHeight: 82, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, backgroundColor: '#fff' },
  summaryLabel: { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  summaryValue: { marginTop: 8, fontSize: 16, fontWeight: '900' },
  months: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: { minHeight: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, marginTop: 12, backgroundColor: '#fff', fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1 },
  categoryList: { gap: 8, paddingVertical: 12 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' },
  pillActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  pillText: { color: Colors.muted, fontWeight: '800', fontSize: 12 },
  pillTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 4, marginBottom: 10 },
  signalCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, backgroundColor: '#fff', gap: 8, marginBottom: 12 },
  signalText: { color: '#111827', fontWeight: '600', lineHeight: 20 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 28 },
});
