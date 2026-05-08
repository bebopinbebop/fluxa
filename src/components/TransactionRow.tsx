import { Image, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import type { Transaction } from '../types/transaction';
import {
  getTransactionDisplayMerchant,
  getTransactionPrimaryCategory,
  getTransactionSignedDisplayAmount,
} from '../lib/transactions';
import { formatCurrency } from '../lib/financials';

export type { Transaction };

function BrandDot({ txn }: { txn: Transaction }) {
  const merchant = getTransactionDisplayMerchant(txn);
  const fallbackLabel = merchant.trim().charAt(0).toUpperCase() || '$';
  return (
    <View style={styles.brand}>
      {txn.logo_url ? (
        <Image source={{ uri: txn.logo_url }} style={styles.logo} resizeMode="contain" />
      ) : (
        <Text style={styles.brandText}>{fallbackLabel}</Text>
      )}
    </View>
  );
}

export function TransactionRow({ txn }: { txn: Transaction }) {
  const displayAmount = getTransactionSignedDisplayAmount(txn);
  const positive = displayAmount >= 0;
  const merchant = getTransactionDisplayMerchant(txn);
  const category = getTransactionPrimaryCategory(txn).replaceAll('_', ' ');

  return (
    <View style={styles.row}>
      <BrandDot txn={txn} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{merchant}</Text>
          {txn.pending ? <Text style={styles.pending}>Pending</Text> : null}
        </View>
        <Text style={styles.date} numberOfLines={1}>{txn.date} • {category}</Text>
        <Text style={styles.rawName} numberOfLines={1}>{txn.name}</Text>
      </View>
      <Text style={[styles.amount, { color: positive ? Colors.green : Colors.red }]}>
        {formatCurrency(displayAmount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  brand: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  logo: { width: 30, height: 30, borderRadius: 6 },
  brandText: { fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontWeight: '800' },
  date: { marginTop: 2, color: Colors.muted, fontSize: 12 },
  rawName: { marginTop: 2, color: Colors.muted, fontSize: 11 },
  pending: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 2 },
  amount: { fontWeight: '900' }
});
