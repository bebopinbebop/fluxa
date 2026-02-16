import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import { Colors } from '../../src/theme/colors';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSendCode() {
    setBusy(true);
    setError(null);
    try {
      const result = await resetPassword({ username: email.trim().toLowerCase() });
      if (result.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setStep('confirm');
      } else {
        setError(`Unexpected reset step: ${result.nextStep.resetPasswordStep}`);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not request reset code.');
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmReset() {
    setBusy(true);
    setError(null);
    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
        newPassword,
      });
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      setError(e?.message ?? 'Could not reset password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>We’ll send a verification code to your email.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email@domain.com"
        style={styles.input}
      />

      {step === 'confirm' ? (
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            placeholder="verification code"
            style={styles.input}
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="new password"
            style={styles.input}
          />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'request' ? (
        <Pressable style={styles.primaryBtn} onPress={onSendCode} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send code'}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.primaryBtn} onPress={onConfirmReset} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Resetting…' : 'Confirm reset'}</Text>
        </Pressable>
      )}

      <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </Pressable>
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
  secondaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: Colors.border },
  secondaryBtnText: { color: '#111', fontSize: 16, fontWeight: '600' },
  error: { marginTop: 10, color: Colors.red }
});
