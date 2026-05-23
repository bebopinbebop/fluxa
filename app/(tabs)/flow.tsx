import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/auth/useAuth';
import { BankDataPlaceholder } from '../../src/components/BankDataPlaceholder';
import { usePullToRefresh } from '../../src/components/PullToRefresh';
import { Colors } from '../../src/theme/colors';

/**
 * This replicates the "stock-ticker / cash-flow diagram" vibe in your Figma.
 * For the prototype build we keep it simple; later you can replace with SVG.
 */
export default function FlowScreen() {
  const pullToRefresh = usePullToRefresh();
  const { hasConnectedBank } = useAuth();

  return (
    <View style={styles.screen}>
      {pullToRefresh.indicator}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
      >
        <Text style={styles.big}>{hasConnectedBank ? '$90,240' : '--'}<Text style={styles.per}>/yr</Text></Text>

        <View style={styles.tagRow}>
          <Text style={[styles.tag, { borderColor: Colors.red, color: Colors.red }]}>Expenses</Text>
          <Text style={[styles.tag, { borderColor: Colors.green, color: Colors.green }]}>LTI $$$</Text>
          <Text style={[styles.tag, { borderColor: Colors.blue, color: Colors.blue }]}>GFS</Text>
        </View>

        {hasConnectedBank ? (
          <View style={styles.warChest}>
            <Text style={styles.wcTitle}>WAR CHEST</Text>
            <Text style={styles.wcAmt}>$10,233.38</Text>
          </View>
        ) : (
          <View style={styles.placeholderWrap}>
            <BankDataPlaceholder />
          </View>
        )}

        <Text style={styles.note}>
          This screen is a placeholder for the flow diagram from Figma. Next step: recreate the arrows + boxes as SVG.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, padding: 16, paddingTop: 40, alignItems: 'center' },
  big: { fontSize: 54, fontWeight: '900', color: Colors.green },
  per: { fontSize: 22, fontWeight: '800', color: Colors.muted },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, fontWeight: '800' },
  warChest: { marginTop: 26, borderWidth: 2, borderColor: '#000', borderRadius: 18, borderStyle: 'dashed', width: '100%', paddingVertical: 20, alignItems: 'center', backgroundColor: '#fff' },
  placeholderWrap: { width: '100%', marginTop: 26 },
  wcTitle: { fontWeight: '900', letterSpacing: 1 },
  wcAmt: { marginTop: 8, fontSize: 22, fontWeight: '900', color: Colors.green },
  note: { marginTop: 16, color: Colors.muted, textAlign: 'center' }
});
