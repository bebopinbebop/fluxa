import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { BrandMark } from '../../src/components/BrandMark';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/auth/useAuth';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      // For a basic layout build, we do email-only sign up (you can add password + code confirm later).
      await signUp(email.trim());
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <BrandMark />
      </View>

      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Enter your email to sign up for this app</Text>

      <View style={{ gap: 12, marginTop: 18 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="email@domain.com"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={onCreate} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Creating…' : 'Login'}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 }}>
          <View style={styles.divider} />
          <Text style={{ color: Colors.muted }}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Continue with Apple</Text>
        </Pressable>

        <Text style={styles.tos}>
          By clicking continue, you agree to our <Text style={{ fontWeight: '600' }}>Terms of Service</Text> and{' '}
          <Text style={{ fontWeight: '600' }}>Privacy Policy</Text>
        </Text>

        <Text style={styles.bottomText}>
          Don’t have an account? <Link href="/(auth)/sign-in" style={styles.link}>Sign in</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 18, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 8, textAlign: 'center' },
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
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  socialBtn: { backgroundColor: '#f2f2f2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  socialText: { fontWeight: '600' },
  tos: { textAlign: 'center', color: Colors.muted, fontSize: 12, marginTop: 6 },
  bottomText: { textAlign: 'center', color: Colors.muted, marginTop: 20 },
  link: { color: Colors.blue, fontWeight: '600' },
  error: { color: Colors.red, marginTop: 4 }
});
