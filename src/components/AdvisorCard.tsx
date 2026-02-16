import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

export function AdvisorCard({ name, onChat, onCalendar }: { name: string; onChat: () => void; onCalendar: () => void }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.muted }}>Your Advisor:</Text>
        <Text style={{ marginTop: 4, color: Colors.green, fontWeight: '900' }}>{name}</Text>
      </View>

      <Pressable style={styles.iconBtn} onPress={onCalendar}>
        <Text style={{ fontWeight: '900' }}>📅</Text>
      </Pressable>
      <Pressable style={styles.iconBtn} onPress={onChat}>
        <Text style={{ fontWeight: '900' }}>💬</Text>
      </Pressable>

      <View style={styles.avatar} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' }
});
