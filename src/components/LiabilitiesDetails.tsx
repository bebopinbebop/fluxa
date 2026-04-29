import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ExpandRow } from './ExpandRow';
import { Colors } from '../theme/colors';
import { calculateFinancialTotals, formatCategoryAmount, formatCurrency, liabilityCategories } from '../lib/financials';

type LiabilitiesDetailsProps = {
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
  showTitle?: boolean;
  totalLiabilities?: number;
};

export function LiabilitiesDetails({
  containerStyle,
  contentContainerStyle,
  scrollProps,
  showTitle = true,
  totalLiabilities,
}: LiabilitiesDetailsProps) {
  const resolvedTotalLiabilities = totalLiabilities ?? calculateFinancialTotals().totalLiabilities;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.headerContent, contentContainerStyle]}>
        {showTitle ? <Text style={styles.title}>Liabilities</Text> : null}
        <Text style={styles.sub}>All of your commitments calculated.</Text>

        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total Liabilities:</Text>
          <Text style={styles.totalValue}>{formatCurrency(resolvedTotalLiabilities)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.rowsScroll}
        contentContainerStyle={styles.rowsContent}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {liabilityCategories.map((category) => (
          <ExpandRow
            key={category.title}
            title={category.title}
            value={formatCategoryAmount(category.amount, category.amount > 0 ? 'negative' : 'positive')}
            tone={category.tone}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.red },
  sub: { marginTop: 8, color: Colors.muted, textAlign: 'center' },
  totalBlock: { marginTop: 18, alignItems: 'center' },
  totalLabel: { color: Colors.muted, fontWeight: '700', fontSize: 13, letterSpacing: 0.4 },
  totalValue: { color: Colors.red, fontWeight: '700', fontSize: 40, marginTop: 6 },
  rowsScroll: { flex: 1 },
  rowsContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
});
