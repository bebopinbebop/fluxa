import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';

type BankDataPlaceholderProps = {
  compact?: boolean;
};

export function BankDataPlaceholder({ compact = false }: BankDataPlaceholderProps) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.image, compact && styles.compactImage]}>
        <View style={styles.bankRoof} />
        <View style={styles.bankBody}>
          <View style={styles.column} />
          <View style={styles.column} />
          <View style={styles.column} />
        </View>
      </View>
      <Text style={styles.title}>Connect your bank to display data</Text>
      <Text style={styles.copy}>This module will fill in once a Plaid account is connected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 170,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  compactCard: {
    minHeight: 128,
    padding: 14,
  },
  image: {
    width: 96,
    height: 66,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  compactImage: {
    width: 78,
    height: 52,
    marginBottom: 10,
  },
  bankRoof: {
    width: 82,
    height: 18,
    backgroundColor: '#DBEAFE',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: Colors.blue,
  },
  bankBody: {
    width: 92,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  column: {
    width: 10,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#BFDBFE',
  },
  title: { color: '#111827', fontWeight: '900', textAlign: 'center' },
  copy: { marginTop: 6, color: Colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
