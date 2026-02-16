import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>We’ll send instructions to your email.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email@domain.com"
        style={styles.input}
      />

      <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
        <Text style={styles.primaryBtnText}>Back</Text>
      </Pressable>

      <Text style={styles.note}>
        Hook this up to Amplify Auth forgot password later. For now this is just the layout.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { marginTop: 8, color: Colors.muted },
  input: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  primaryBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { marginTop: 16, color: Colors.muted }
});
