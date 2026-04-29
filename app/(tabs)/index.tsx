import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow, Transaction } from '../../src/components/TransactionRow';
import { HighlightCard } from '../../src/components/HighlightCard';
import { AdvisorCard } from '../../src/components/AdvisorCard';
import { AssetsDetails } from '../../src/components/AssetsDetails';
import { LiabilitiesDetails } from '../../src/components/LiabilitiesDetails';
import { SettingsDetails } from '../../src/components/SettingsDetails';
import { SlidingOverlayCard } from '../../src/components/SlidingOverlayCard';
import { SlidingOverlayScreen } from '../../src/components/SlidingOverlayScreen';
import { FinancialSummaryCard } from '../../src/components/FinancialSummaryCard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/useAuth';
import { formatCurrency, getProfileFinancialTotals } from '../../src/lib/financials';

const txns: Transaction[] = [
  { id: '1', name: 'McDonalds', date: '18-04-2024 | 10:23 AM', amount: -35.32, brand: 'mcd' },
  { id: '2', name: 'Youtube', date: '18-04-2024 | 10:07 AM', amount: 121.02, brand: 'yt' },
  { id: '3', name: 'Walmart', date: '16-04-2024 | 11:45 AM', amount: -146.3, brand: 'walmart' }
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const firstName = profile?.firstName?.trim() || 'there';
  const { totalAssets, totalLiabilities, totalNetWorth } = getProfileFinancialTotals(profile);
  const netWorthValue = formatCurrency(totalNetWorth);
  const [isAssetsPanelOpen, setIsAssetsPanelOpen] = useState(false);
  const [isLiabilitiesPanelOpen, setIsLiabilitiesPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const openAssetsPanel = () => setIsAssetsPanelOpen(true);
  const closeAssetsPanel = () => setIsAssetsPanelOpen(false);
  const openLiabilitiesPanel = () => setIsLiabilitiesPanelOpen(true);
  const closeLiabilitiesPanel = () => setIsLiabilitiesPanelOpen(false);
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <>
      <FlatList
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={[styles.container, { paddingTop: 20 }]}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View style={styles.headerSide}>
                <Pressable style={styles.backButton} onPress={signOut}>
                  <Text style={styles.backButtonText}>←</Text>
                </Pressable>
                <Text style={styles.headerText}>
                  Hello <Text style={{ color: Colors.blue }}>{firstName}</Text>
                </Text>
              </View>

              <Pressable style={styles.avatarButton} onPress={openSettings}>
                <Text style={styles.avatarEmoji}>🙂</Text>
              </Pressable>

              <Text style={[styles.headerText, styles.headerSideRight]}>
                Good <Text style={{ color: Colors.blue }}>Afternoon</Text>
              </Text>
            </View>

            <View style={styles.netWorthCard}>
              <Text style={styles.cardLabel}>YOUR TOTAL NET WORTH</Text>
              <Text style={styles.netWorthValue}>{netWorthValue}</Text>

              <Pressable style={styles.plusBtn} onPress={() => router.push('/(tabs)/accounts/connect')}>
                <Text style={{ fontSize: 22, color: Colors.blue }}>+</Text>
              </Pressable>

              <View style={styles.assetsRow}>
                <FinancialSummaryCard
                  title="Assets"
                  value={totalAssets}
                  tone="green"
                  onPress={openAssetsPanel}
                  directionSymbol="▲"
                />

                <FinancialSummaryCard
                  title="Liabilities"
                  value={totalLiabilities}
                  tone="red"
                  onPress={openLiabilitiesPanel}
                  directionSymbol="▼"
                />
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
            <HighlightCard title="Your Total Net Worth" value={netWorthValue} tone="green" />
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

      <SlidingOverlayCard
        visible={isAssetsPanelOpen}
        onClose={closeAssetsPanel}
        title="Assets"
        titleColor={Colors.green}
        direction="left"
        topInset={insets.top + 24}
        bottomInset={insets.bottom + 24}
      >
        <AssetsDetails
          showTitle={false}
          totalAssets={totalAssets}
          contentContainerStyle={styles.overlayContent}
          scrollProps={{ bounces: false }}
        />
      </SlidingOverlayCard>

      <SlidingOverlayCard
        visible={isLiabilitiesPanelOpen}
        onClose={closeLiabilitiesPanel}
        title="Liabilities"
        titleColor={Colors.red}
        direction="right"
        topInset={insets.top + 24}
        bottomInset={insets.bottom + 24}
      >
        <LiabilitiesDetails
          showTitle={false}
          totalLiabilities={totalLiabilities}
          contentContainerStyle={styles.overlayContent}
          scrollProps={{ bounces: false }}
        />
      </SlidingOverlayCard>

      <SlidingOverlayScreen
        visible={isSettingsOpen}
        onClose={closeSettings}
        title="Settings"
        topInset={insets.top}
      >
        <SettingsDetails contentContainerStyle={styles.settingsContent} />
      </SlidingOverlayScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSideRight: { flex: 1, textAlign: 'right' },
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
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  avatarEmoji: { fontSize: 22 },
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
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  link: { color: Colors.muted },
  overlayContent: {
    paddingTop: 10,
    paddingRight: 18,
    paddingLeft: 18,
  },
  settingsContent: {
    paddingTop: 8,
  },
});
