import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/theme/colors';

/**
 * This replicates the "stock-ticker / cash-flow diagram" vibe in your Figma.
 * For the prototype build we keep it simple; later you can replace with SVG.
 */
export default function FlowScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.big}>$90,240<Text style={styles.per}>/yr</Text></Text>

      <View style={styles.tagRow}>
        <Text style={[styles.tag, { borderColor: Colors.red, color: Colors.red }]}>Expenses</Text>
        <Text style={[styles.tag, { borderColor: Colors.green, color: Colors.green }]}>LTI $$$</Text>
        <Text style={[styles.tag, { borderColor: Colors.blue, color: Colors.blue }]}>GFS</Text>
      </View>

      <View style={styles.warChest}>
        <Text style={styles.wcTitle}>WAR CHEST</Text>
        <Text style={styles.wcAmt}>$10,233.38</Text>
      </View>

      <Text style={styles.note}>
        This screen is a placeholder for the flow diagram from Figma. Next step: recreate the arrows + boxes as SVG.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: 16, paddingTop: 40, alignItems: 'center' },
  big: { fontSize: 54, fontWeight: '900', color: Colors.green },
  per: { fontSize: 22, fontWeight: '800', color: Colors.muted },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, fontWeight: '800' },
  warChest: { marginTop: 26, borderWidth: 2, borderColor: '#000', borderRadius: 18, borderStyle: 'dashed', width: '100%', paddingVertical: 20, alignItems: 'center', backgroundColor: '#fff' },
  wcTitle: { fontWeight: '900', letterSpacing: 1 },
  wcAmt: { marginTop: 8, fontSize: 22, fontWeight: '900', color: Colors.green },
  note: { marginTop: 16, color: Colors.muted, textAlign: 'center' }
});
