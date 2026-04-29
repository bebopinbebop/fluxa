import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { formatCurrency, getFinancialToneColor, type FinancialTone } from '../lib/financials';

type FinancialSummaryCardProps = {
  title: string;
  value: number;
  tone: FinancialTone;
  onPress: () => void;
  directionSymbol: string;
};

export function FinancialSummaryCard({
  title,
  value,
  tone,
  onPress,
  directionSymbol,
}: FinancialSummaryCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={[styles.directionSymbol, { color: getFinancialToneColor(tone) }]}>{directionSymbol}</Text>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{formatCurrency(value)}</Text>
      </View>
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  directionSymbol: {
    fontWeight: '800',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  value: {
    color: Colors.muted,
    marginTop: 2,
    fontSize: 12,
  },
  plus: {
    color: Colors.muted,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '500',
  },
});
