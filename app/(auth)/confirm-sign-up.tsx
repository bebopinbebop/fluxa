import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../src/auth/useAuth';
import { BrandMark } from '../../src/components/BrandMark';
import { Colors } from '../../src/theme/colors';

export default function ConfirmSignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = typeof params.email === 'string' ? params.email : '';
  const { confirmSignUp } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    if (!email.trim() || !confirmationCode.trim()) {
      setError('Enter your email and confirmation code.');
      return;
    }

    setError(null);
    setBusy(true);

    try {
      await confirmSignUp({ email, confirmationCode });
      router.replace('/(auth)/sign-in');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Confirmation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.brandWrap}>
        <BrandMark />
      </View>

      <Text style={styles.title}>Confirm sign up</Text>
      <Text style={styles.subtitle}>Enter the code sent to your email.</Text>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="email@domain.com"
          style={styles.input}
        />
        <TextInput
          value={confirmationCode}
          onChangeText={setConfirmationCode}
          keyboardType="number-pad"
          placeholder="Confirmation code"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onConfirm} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Confirming...' : 'Confirm account'}</Text>
        </Pressable>

        <Text style={styles.bottomText}>
          Back to <Link href="/(auth)/sign-in" style={styles.link}>sign in</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20, paddingTop: 72 },
  brandWrap: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 8 },
  form: { gap: 12, marginTop: 22 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  primaryBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.9 },
  bottomText: { textAlign: 'center', color: Colors.muted, marginTop: 14 },
  link: { color: Colors.blue, fontWeight: '600' },
  error: { color: Colors.red },
});
