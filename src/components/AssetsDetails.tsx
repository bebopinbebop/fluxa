import { View, Text, StyleSheet, ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { ExpandRow } from './ExpandRow';
import { assetCategories, calculateFinancialTotals, formatCategoryAmount, formatCurrency } from '../lib/financials';

type AssetsDetailsProps = {
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
  showTitle?: boolean;
  totalAssets?: number;
};

export function AssetsDetails({
  containerStyle,
  contentContainerStyle,
  scrollProps,
  showTitle = true,
  totalAssets,
}: AssetsDetailsProps) {
  const resolvedTotalAssets = totalAssets ?? calculateFinancialTotals().totalAssets;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.headerContent, contentContainerStyle]}>
        {showTitle ? <Text style={styles.title}>Assets</Text> : null}
        <Text style={styles.sub}>All of your value calculated without debt.</Text>

        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total Assets:</Text>
          <Text style={styles.totalValue}>{formatCurrency(resolvedTotalAssets)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.rowsScroll}
        contentContainerStyle={styles.rowsContent}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {assetCategories.map((category) => (
          <ExpandRow
            key={category.title}
            title={category.title}
            value={formatCategoryAmount(category.amount)}
            tone={category.tone}
          >
            {category.details?.length ? (
              <View style={styles.innerCard}>
                {category.details.map((detail) => (
                  <Text key={detail} style={styles.innerLine}>
                    {detail}
                  </Text>
                ))}
              </View>
            ) : null}
          </ExpandRow>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.green },
  sub: { marginTop: 8, color: Colors.muted, textAlign: 'center' },
  totalBlock: { marginTop: 18, alignItems: 'center' },
  totalLabel: { color: Colors.muted, fontWeight: '700', fontSize: 13, letterSpacing: 0.4 },
  totalValue: { color: Colors.green, fontWeight: '700', fontSize: 40, marginTop: 6 },
  rowsScroll: { flex: 1 },
  rowsContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  innerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  innerLine: { color: Colors.muted, marginTop: 6 },
});
