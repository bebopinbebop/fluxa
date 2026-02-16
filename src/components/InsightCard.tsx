import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

export function InsightCard({
  title,
  subtitle,
  tone,
  cta
}: {
  title: string;
  subtitle: string;
  tone: 'green' | 'red' | 'blue';
  cta: string;
}) {
  const color = tone === 'green' ? Colors.green : tone === 'red' ? Colors.red : Colors.blue;
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Breakdown</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.fakeViz, { borderColor: color }]} />
      <Text style={{ marginTop: 10, color: Colors.muted }}>{subtitle}</Text>
      <Pressable style={styles.btn}>
        <Text style={styles.btnText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 260, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14 },
  kicker: { fontWeight: '900', color: Colors.muted, fontSize: 12 },
  title: { marginTop: 4, fontSize: 18, fontWeight: '900' },
  fakeViz: { marginTop: 12, height: 80, borderWidth: 3, borderRadius: 14, opacity: 0.25 },
  btn: { marginTop: 14, backgroundColor: '#111', borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' }
});
