import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { ExpandRow } from '../../src/components/ExpandRow';

export default function AssetsScreen() {
  return (
    <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assets</Text>
      <Text style={styles.sub}>All of your value calculated without debt.</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Assets:</Text>
        <Text style={styles.totalValue}>$182,543.32</Text>
      </View>

      <ExpandRow title="Cash" value="$40,159.53" tone="green" expanded>
        <View style={styles.innerCard}>
          <Text style={styles.innerLine}>Checking • $2,300.23 • 386492731324</Text>
          <Text style={styles.innerLine}>Savings • $10,233.38 • 239137402132</Text>
          <Text style={styles.innerLine}>Checking • $27,625.92 • 203817482291</Text>
        </View>
      </ExpandRow>

      <ExpandRow title="Investments" value="$54,762.00" tone="green" />
      <ExpandRow title="Life Insurance" value="$36,508.64" tone="green" />
      <ExpandRow title="Real Estate" value="$38,334.97" tone="green" />
      <ExpandRow title="Other" value="$12,778.04" tone="green" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 18 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { marginTop: 6, color: Colors.muted },
  totalRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: Colors.muted, fontWeight: '600' },
  totalValue: { color: Colors.green, fontWeight: '800' },
  innerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  innerLine: { color: Colors.muted, marginTop: 6 }
});
