import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

export function HighlightCard({
  title,
  value,
  tone,
  cta
}: {
  title: string;
  value: string;
  tone: 'green' | 'red' | 'blue';
  cta?: string;
}) {
  const color = tone === 'green' ? Colors.green : tone === 'red' ? Colors.red : Colors.blue;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {cta ? (
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16 },
  title: { fontWeight: '800' },
  value: { marginTop: 8, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  btn: { marginTop: 12, alignSelf: 'center', backgroundColor: '#111', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  btnText: { color: '#fff', fontWeight: '800' }
});
