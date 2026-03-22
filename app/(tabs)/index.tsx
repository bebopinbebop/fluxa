import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow, Transaction } from '../../src/components/TransactionRow';
import { HighlightCard } from '../../src/components/HighlightCard';
import { AdvisorCard } from '../../src/components/AdvisorCard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/useAuth';

const txns: Transaction[] = [
  { id: '1', name: 'McDonalds', date: '18-04-2024 | 10:23 AM', amount: -35.32, brand: 'mcd' },
  { id: '2', name: 'Youtube', date: '18-04-2024 | 10:07 AM', amount: 121.02, brand: 'yt' },
  { id: '3', name: 'Walmart', date: '16-04-2024 | 11:45 AM', amount: -146.3, brand: 'walmart' }
];

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const firstName = profile?.firstName?.trim() || 'there';
  const monthlyIncome = formatCurrency(profile?.monthlyIncome);

  return (
    <FlatList
      style={{ backgroundColor: Colors.bg }}
      contentContainerStyle={[styles.container, { paddingTop: 20}]}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.backButton} onPress={signOut}>
                <Text style={styles.backButtonText}>←</Text>
              </Pressable>
              <Text style={styles.headerText}>
                Hello <Text style={{ color: Colors.blue }}>{firstName}</Text>
              </Text>
            </View>
            <Text style={styles.headerText}>
              Good <Text style={{ color: Colors.blue }}>Afternoon</Text>
            </Text>
          </View>

          <View style={styles.netWorthCard}>
            <Text style={styles.cardLabel}>YOUR MONTHLY INCOME</Text>
            <Text style={styles.netWorthValue}>{monthlyIncome}</Text>

            <Pressable style={styles.plusBtn} onPress={() => router.push('/(tabs)/accounts/connect')}>
              <Text style={{ fontSize: 22, color: Colors.blue }}>+</Text>
            </Pressable>

            <View style={styles.assetsRow}>
              <Pressable style={styles.smallPill} onPress={() => router.push('/(tabs)/assets')}>
                <Text style={styles.pillArrow}>▲</Text>
                <View>
                  <Text style={styles.pillTitle}>Assets</Text>
                  <Text style={styles.pillSub}>$182,543.32</Text>
                </View>
              </Pressable>

              <Pressable style={styles.smallPill} onPress={() => router.push('/(tabs)/liabilities')}>
                <Text style={[styles.pillArrow, { color: Colors.red }]}>▼</Text>
                <View>
                  <Text style={styles.pillTitle}>Liabilities</Text>
                  <Text style={styles.pillSub}>$146,897.45</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.link}>See all</Text>
            </Pressable>
          </View>
        </>
      }
      data={txns}
      renderItem={({ item }) => <TransactionRow txn={item} />}
      keyExtractor={(i) => i.id}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListFooterComponent={
        <>
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Highlights</Text>
          <HighlightCard title="Your Monthly Income" value={monthlyIncome} tone="green" />
          <AdvisorCard
            name="Jordan Schenkman"
            onChat={() => router.push('/(tabs)/chat')}
            onCalendar={() => router.push('/(tabs)/chat')}
          />
          <HighlightCard title="Using ai analytics" value="Get Unleashed to look at your data." tone="blue" />
          <HighlightCard title="Identity theft" value="You are in the clear!" tone="green" cta="See More" />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { fontSize: 16, fontWeight: '600' },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonText: { fontSize: 18, fontWeight: '700', color: Colors.blue },
  netWorthCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff'
  },
  cardLabel: { textAlign: 'center', fontSize: 12, color: Colors.muted, letterSpacing: 1 },
  netWorthValue: { textAlign: 'center', fontSize: 40, fontWeight: '700', color: Colors.green, marginTop: 8 },
  plusBtn: { position: 'absolute', right: 12, top: 12, width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  assetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  smallPill: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  pillArrow: { color: Colors.green, fontWeight: '800' },
  pillTitle: { fontWeight: '700' },
  pillSub: { color: Colors.muted, marginTop: 2, fontSize: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  link: { color: Colors.muted }
});
