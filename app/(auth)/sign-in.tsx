import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/auth/useAuth';
import { BrandMark } from '../../src/components/BrandMark';
import { Colors } from '../../src/theme/colors';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'An unknown error has occurred while signing in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <BrandMark />
      </View>

      <Text style={styles.title}>Sign <Text style={{ color: Colors.blue }}>In</Text></Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={{ gap: 12, marginTop: 18 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="email@domain.com"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="password"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={onLogin} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Logging in…' : 'Login'}</Text>
        </Pressable>

        <Link href="/(auth)/forgot-password" style={styles.linkCenter}>
          Forgot password?
        </Link>

        <Text style={styles.bottomText}>
          Don’t have an account? <Link href="/(auth)/sign-up" style={styles.link}>Sign up</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 18 },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  primaryBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkCenter: { textAlign: 'center', color: Colors.blue, marginTop: 10 },
  bottomText: { textAlign: 'center', color: Colors.muted, marginTop: 18 },
  link: { color: Colors.blue, fontWeight: '600' },
  error: { color: Colors.red, marginTop: 4 }
});
