import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export type Transaction = {
  id: string;
  name: string;
  date: string;
  amount: number;
  brand?: 'mcd' | 'yt' | 'walmart' | 'amazon';
};

function BrandDot({ brand }: { brand?: Transaction['brand'] }) {
  const label = brand === 'mcd' ? 'M' : brand === 'yt' ? '▶' : brand === 'walmart' ? '✳' : 'a';
  return (
    <View style={styles.brand}>
      <Text style={{ fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

export function TransactionRow({ txn }: { txn: Transaction }) {
  const positive = txn.amount >= 0;
  return (
    <View style={styles.row}>
      <BrandDot brand={txn.brand} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{txn.name}</Text>
        <Text style={styles.date}>{txn.date}</Text>
      </View>
      <Text style={[styles.amount, { color: positive ? Colors.green : Colors.red }]}>
        {positive ? '$' : '-$'}
        {Math.abs(txn.amount).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  brand: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  name: { fontWeight: '800' },
  date: { marginTop: 2, color: Colors.muted, fontSize: 12 },
  amount: { fontWeight: '900' }
});
