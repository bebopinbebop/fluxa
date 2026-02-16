import { ScrollView, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { ExpandRow } from '../../src/components/ExpandRow';

export default function LiabilitiesScreen() {
  return (
    <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liabilities</Text>
      <Text style={styles.sub}>All of your commitments calculated.</Text>

      <Text style={styles.total}>Total Liabilities: <Text style={{ color: Colors.red }}>$14,897.45</Text></Text>

      <ExpandRow title="Credit" value="-$33,786.42" tone="red" />
      <ExpandRow title="Lease" value="$0" tone="green" />
      <ExpandRow title="Mortgages" value="-$47,007.18" tone="red" />
      <ExpandRow title="Loans" value="-$4,4069.24" tone="red" />
      <ExpandRow title="Other" value="-$22,034.61" tone="red" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 18 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { marginTop: 6, color: Colors.muted },
  total: { marginTop: 12, fontWeight: '700' }
});
