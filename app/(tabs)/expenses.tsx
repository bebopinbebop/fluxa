import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow, Transaction } from '../../src/components/TransactionRow';
import { InsightCard } from '../../src/components/InsightCard';

const txns: Transaction[] = [
  { id: '1', name: 'McDonalds', date: '18-04-2024 | 10:23 AM', amount: -35.32, brand: 'mcd' },
  { id: '2', name: 'Youtube', date: '18-04-2024 | 10:07 AM', amount: 121.02, brand: 'yt' },
  { id: '3', name: 'Walmart', date: '16-04-2024 | 11:45 AM', amount: -146.3, brand: 'walmart' }
];

const ranges = ['7 Day', '30 Day', '90 Day', '360 Day'] as const;

export default function ExpensesScreen() {
  return (
    <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.header}>Your <Text style={{ color: Colors.blue }}>Expenses</Text></Text>

      <View style={styles.pills}>
        {ranges.map((r, i) => (
          <Pressable key={r} style={[styles.pill, i === 0 && styles.pillActive]}>
            <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={{ fontWeight: '700' }}>Last 7 Days</Text>
        <View style={styles.fakeChart}>
          <View style={styles.fakeLine} />
          <Text style={styles.chartNote}>Line chart placeholder (use victory-native or react-native-svg later)</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.link}>See all</Text>
      </View>

      <View style={{ gap: 10 }}>
        {txns.map((t) => <TransactionRow key={t.id} txn={t} />)}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Analysis</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
        <InsightCard title="Expense Categories" subtitle="$342 spent in May" tone="blue" cta="See More" />
        <InsightCard title="Cash Flow" subtitle="+$3,724.59 net" tone="green" cta="See More" />
        <InsightCard title="Recurring Transactions" subtitle="ADP + MTA eCash" tone="red" cta="See all" />
        <InsightCard title="Make a budget" subtitle="Help yourself with a budget" tone="blue" cta="See all" />
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 18, paddingBottom: 30 },
  header: { fontSize: 20, fontWeight: '800' },
  pills: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#eee' },
  pillActive: { backgroundColor: Colors.blue },
  pillText: { fontWeight: '600', color: '#333' },
  pillTextActive: { color: '#fff' },
  chartCard: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14 },
  fakeChart: { height: 160, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fakeLine: { position: 'absolute', width: '120%', height: 3, backgroundColor: Colors.green, transform: [{ rotate: '-10deg' }], opacity: 0.6 },
  chartNote: { color: Colors.muted, textAlign: 'center', paddingHorizontal: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  link: { color: Colors.muted }
});
