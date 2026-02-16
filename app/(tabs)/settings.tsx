import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/auth/useAuth';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  return (
    <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Helena Hills</Text>

      <View style={styles.avatar} />
      <Text style={styles.link}>Edit profile image</Text>

      <View style={styles.row}><Text style={styles.label}>Name</Text><Text>Helena Hills</Text></View>
      <View style={styles.row}><Text style={styles.label}>Username</Text><Text>hills_have_eyes</Text></View>
      <View style={styles.row}><Text style={styles.label}>Email</Text><Text>hills_have_eyes@gmail.com</Text></View>
      <View style={styles.row}><Text style={styles.label}>Phone</Text><Text>1-888-447-5594</Text></View>

      <Text style={styles.section}>Linked Accounts</Text>
      {['Bank of America', 'Chase', 'TD Ameritrade', 'Gerber Life Insurance', 'American Express', 'Vanguard'].map((n) => (
        <View key={n} style={styles.accountRow}>
          <View style={styles.iconStub} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>{n}</Text>
            <Text style={{ color: Colors.muted, marginTop: 2 }}>Account details…</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 18, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  avatar: { marginTop: 14, width: 92, height: 92, borderRadius: 46, backgroundColor: '#ddd' },
  link: { marginTop: 10, color: Colors.blue, fontWeight: '700' },
  row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { color: Colors.muted, fontWeight: '700' },
  section: { width: '100%', marginTop: 18, fontWeight: '900' },
  accountRow: { width: '100%', flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center' },
  iconStub: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eee' },
  signOut: { marginTop: 18, width: '100%', backgroundColor: '#111', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }
});
