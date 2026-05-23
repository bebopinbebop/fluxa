import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow } from '../../src/components/TransactionRow';
import { AdvisorCard } from '../../src/components/AdvisorCard';
import { AssetsDetails } from '../../src/components/AssetsDetails';
import { LiabilitiesDetails } from '../../src/components/LiabilitiesDetails';
import { SettingsDetails } from '../../src/components/SettingsDetails';
import { SlidingOverlayCard } from '../../src/components/SlidingOverlayCard';
import { SlidingOverlayScreen } from '../../src/components/SlidingOverlayScreen';
import { FinancialSummaryCard } from '../../src/components/FinancialSummaryCard';
import { TransactionsDetails } from '../../src/components/TransactionsDetails';
import { ConnectAccountDetails } from '../../src/components/ConnectAccountDetails';
import { BankDataPlaceholder } from '../../src/components/BankDataPlaceholder';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { usePullToRefresh } from '../../src/components/PullToRefresh';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/useAuth';
import { useModalNavigationLock } from '../../src/navigation/ModalNavigationLock';
import { formatCurrency, getProfileFinancialTotals } from '../../src/lib/financials';
import {
  detectRecurringSubscriptions,
  getIncomeExpenseSummary,
  getRecentTransactions,
  getTotalSpendingByMonth,
  identifyHighSpendingCategories,
} from '../../src/lib/transactions';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setTabNavigationLocked } = useModalNavigationLock();
  const pullToRefresh = usePullToRefresh();
  const { financialSnapshot, hasConnectedBank, profile, signOut, transactions } = useAuth();
  const recentTransactions = getRecentTransactions(transactions, 10);
  const cashFlow = getIncomeExpenseSummary(transactions);
  const aprilSpending = getTotalSpendingByMonth(transactions, '2026-04');
  const highCategory = identifyHighSpendingCategories(transactions, 1)[0];
  const recurringSubscriptions = detectRecurringSubscriptions(transactions);
  const monthlyIncome = financialSnapshot?.monthlyIncome ?? cashFlow.income;
  const monthlyExpenses = financialSnapshot?.monthlyExpenses ?? (aprilSpending || cashFlow.expenses);
  const monthlyCashFlow = financialSnapshot?.monthlyCashFlow ?? cashFlow.net;
  const savingsRate = (financialSnapshot?.savingsRate ?? (monthlyIncome > 0 ? (monthlyCashFlow / monthlyIncome) * 100 : 0)).toFixed(1);
  const potentialGrowth = monthlyCashFlow > 0 ? Math.min(18, 4 + Number(savingsRate) / 2).toFixed(1) : '0.0';
  const firstName = profile?.name?.trim().split(/\s+/)[0] || profile?.firstName?.trim() || 'there';
  const profileTotals = getProfileFinancialTotals(profile, financialSnapshot);
  const totalAssets = hasConnectedBank ? profileTotals.totalAssets : 0;
  const totalLiabilities = hasConnectedBank ? profileTotals.totalLiabilities : 0;
  const totalNetWorth = hasConnectedBank ? profileTotals.totalNetWorth : 0;
  const netWorthValue = hasConnectedBank ? formatCurrency(totalNetWorth) : '--';
  const [isAssetsPanelOpen, setIsAssetsPanelOpen] = useState(false);
  const [isLiabilitiesPanelOpen, setIsLiabilitiesPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransactionsPanelOpen, setIsTransactionsPanelOpen] = useState(false);
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState(false);
  const isAnyOverlayOpen =
    isAssetsPanelOpen ||
    isLiabilitiesPanelOpen ||
    isSettingsOpen ||
    isTransactionsPanelOpen ||
    isConnectAccountOpen;

  useEffect(() => {
    setTabNavigationLocked(isAnyOverlayOpen);

    return () => setTabNavigationLocked(false);
  }, [isAnyOverlayOpen, setTabNavigationLocked]);

  const openAssetsPanel = () => setIsAssetsPanelOpen(true);
  const closeAssetsPanel = () => setIsAssetsPanelOpen(false);
  const openLiabilitiesPanel = () => setIsLiabilitiesPanelOpen(true);
  const closeLiabilitiesPanel = () => setIsLiabilitiesPanelOpen(false);
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const openTransactionsPanel = () => setIsTransactionsPanelOpen(true);
  const closeTransactionsPanel = () => setIsTransactionsPanelOpen(false);
  const openConnectAccount = () => setIsConnectAccountOpen(true);
  const closeConnectAccount = () => setIsConnectAccountOpen(false);

  return (
    <View style={styles.screen}>
      {pullToRefresh.indicator}
      <FlatList
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={[styles.container, { paddingTop: 20 }]}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
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
                <ProfileAvatar size={42} profileImageKey={profile?.profileImageKey} />
              </Pressable>

              <Text style={[styles.headerText, styles.headerSideRight]}>
                Good <Text style={{ color: Colors.blue }}>Afternoon</Text>
              </Text>
            </View>

            <View style={styles.netWorthCard}>
              <Text style={styles.cardLabel}>YOUR TOTAL NET WORTH</Text>
              <Text style={styles.netWorthValue}>{netWorthValue}</Text>

              <Pressable style={styles.plusBtn} onPress={openConnectAccount}>
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
              <Pressable onPress={openTransactionsPanel}>
                <Text style={styles.link}>See all</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.recentTransactionsScroller}
              contentContainerStyle={styles.recentTransactionsContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {hasConnectedBank ? (
                recentTransactions.map((transaction) => (
                  <TransactionRow key={transaction.transaction_id} txn={transaction} />
                ))
              ) : (
                <BankDataPlaceholder compact />
              )}
            </ScrollView>
          </>
        }
        data={[]}
        renderItem={() => null}
        ListFooterComponent={
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Highlights</Text>
            {hasConnectedBank ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsCarousel}>
                <HighlightMetric title="Monthly Income" value={formatCurrency(monthlyIncome)} tone="green" />
                <HighlightMetric title="Monthly Expenses" value={formatCurrency(monthlyExpenses)} tone="red" />
                <HighlightMetric title="Cash Flow" value={formatCurrency(monthlyCashFlow)} tone={monthlyCashFlow >= 0 ? 'green' : 'red'} />
                <HighlightMetric title="Savings Rate" value={`${savingsRate}%`} tone={Number(savingsRate) >= 20 ? 'green' : 'blue'} />
                <HighlightMetric title="Growth Potential" value={`${potentialGrowth}%`} tone={Number(potentialGrowth) > 0 ? 'green' : 'red'} />
                <HighlightMetric
                  title="Highest Category"
                  value={financialSnapshot?.topSpendingCategory?.replaceAll('_', ' ') ?? (highCategory ? highCategory.category.replaceAll('_', ' ') : 'None')}
                  subtitle={formatCurrency(financialSnapshot?.topSpendingCategoryAmount ?? highCategory?.amount)}
                  tone="blue"
                />
                <HighlightMetric title="Subscriptions" value={`${financialSnapshot?.recurringSubscriptionCount ?? recurringSubscriptions.length}`} subtitle="recurring detected" tone="blue" />
              </ScrollView>
            ) : (
              <BankDataPlaceholder compact />
            )}
            <AdvisorCard
              name="Jordan Schenkman"
              onChat={() => router.push('/(tabs)/chat')}
              onCalendar={() => router.push('/(tabs)/chat')}
            />
          </>
        }
      />

      <SlidingOverlayCard
        visible={isAssetsPanelOpen}
        onClose={closeAssetsPanel}
        title="Assets"
        titleColor={Colors.green}
        direction="left"
        actionLabel="+"
        onActionPress={openConnectAccount}
        topInset={insets.top + 10}
        bottomInset={insets.bottom + 10}
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
        actionLabel="+"
        onActionPress={openConnectAccount}
        topInset={insets.top + 10}
        bottomInset={insets.bottom + 10}
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

      <SlidingOverlayCard
        visible={isTransactionsPanelOpen}
        onClose={closeTransactionsPanel}
        title="Transactions"
        titleColor={Colors.blue}
        direction="top"
        topInset={insets.top + 10}
        bottomInset={insets.bottom + 10}
      >
        <TransactionsDetails />
      </SlidingOverlayCard>

      <SlidingOverlayCard
        visible={isConnectAccountOpen}
        onClose={closeConnectAccount}
        title="Connect Account"
        titleColor={Colors.blue}
        direction="top"
        topInset={insets.top + 10}
        bottomInset={insets.bottom + 10}
      >
        <ConnectAccountDetails />
      </SlidingOverlayCard>
    </View>
  );
}

function HighlightMetric({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone: 'green' | 'red' | 'blue';
}) {
  const color = tone === 'green' ? Colors.green : tone === 'red' ? Colors.red : Colors.blue;
  return (
    <View style={styles.highlightMetric}>
      <Text style={styles.highlightTitle}>{title}</Text>
      <Text style={[styles.highlightValue, { color }]} numberOfLines={2}>{value}</Text>
      {subtitle ? <Text style={styles.highlightSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
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
  recentTransactionsScroller: { maxHeight: 244, marginTop: 10 },
  recentTransactionsContent: { gap: 10, paddingBottom: 2 },
  highlightsCarousel: { gap: 12, paddingVertical: 10 },
  highlightMetric: {
    width: 190,
    minHeight: 126,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
  },
  highlightTitle: { color: Colors.muted, fontSize: 12, fontWeight: '800' },
  highlightValue: { marginTop: 12, fontSize: 25, fontWeight: '900' },
  highlightSubtitle: { marginTop: 8, color: Colors.muted, fontSize: 12, fontWeight: '700' },
  overlayContent: {
    paddingTop: 10,
    paddingRight: 18,
    paddingLeft: 18,
  },
  settingsContent: {
    paddingTop: 8,
  },
});
