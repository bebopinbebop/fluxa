import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { TransactionRow, Transaction } from '../../src/components/TransactionRow';

const txns: Transaction[] = [
  { id: '1', name: 'McDonalds', date: '18-04-2024 | 10:23 AM', amount: -35.32, brand: 'mcd' },
  { id: '2', name: 'Youtube', date: '18-04-2024 | 10:07 AM', amount: 121.02, brand: 'yt' },
  { id: '3', name: 'Walmart', date: '16-04-2024 | 11:45 AM', amount: -146.3, brand: 'walmart' },
  { id: '4', name: 'Amazon', date: '13-04-2024 | 09:15 AM', amount: 425.32, brand: 'amazon' }
];

export default function TransactionsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Recent Transactions</Text>
      <FlatList
        data={txns}
        renderItem={({ item }) => <TransactionRow txn={item} />}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: 16, paddingTop: 18 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 }
});
