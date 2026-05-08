import { View, StyleSheet } from 'react-native';
import { TransactionsDetails } from '../../src/components/TransactionsDetails';
import { Colors } from '../../src/theme/colors';

export default function TransactionsScreen() {
  return (
    <View style={styles.screen}>
      <TransactionsDetails />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
});
