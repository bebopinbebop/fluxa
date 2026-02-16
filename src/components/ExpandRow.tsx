import { ReactNode, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

export function ExpandRow({
  title,
  value,
  tone,
  expanded: expandedProp,
  children
}: {
  title: string;
  value: string;
  tone: 'green' | 'red';
  expanded?: boolean;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(!!expandedProp);
  const color = tone === 'green' ? Colors.green : Colors.red;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.row} onPress={() => setExpanded((v) => !v)}>
        <View style={[styles.icon, { backgroundColor: color + '22' }]}>
          <Text style={{ fontWeight: '900' }}>{title.slice(0, 1)}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={{ marginLeft: 8, color: Colors.muted }}>{expanded ? '˄' : '˅'}</Text>
      </Pressable>
      {expanded && children ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '900' },
  value: { fontWeight: '900' }
});
