import { useRouter } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/useAuth';
import { Colors } from '../../src/theme/colors';

const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;
const riskLevels = ['Conservative', 'Balanced', 'Aggressive'] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cancelOnboarding, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function nextStep() {
    if (step === 1 && (!firstName.trim() || !ageRange)) {
      setError('Enter your first name and choose an age range.');
      return;
    }

    if (step === 2 && (!monthlyIncome.trim() || !monthlyExpenses.trim())) {
      setError('Enter your monthly income and expenses.');
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 3));
  }

  function resetForm() {
    setStep(1);
    setFirstName('');
    setAgeRange('');
    setMonthlyIncome('');
    setMonthlyExpenses('');
    setRiskTolerance('');
    setError(null);
  }

  async function handleCancelOnboarding() {
    if (busy) return;

    resetForm();
    setBusy(true);

    try {
      await cancelOnboarding();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to cancel onboarding.');
      setBusy(false);
    }
  }

  async function submit() {
    if (!riskTolerance) {
      setError('Choose your risk tolerance.');
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const user = await getCurrentUser();
      const email = user.signInDetails?.loginId ?? user.username;

      if (!email) {
        throw new Error('Unable to determine the signed-in user email.');
      }

      await completeOnboarding({
        email,
        firstName: firstName.trim(),
        ageRange,
        monthlyIncome: Number(monthlyIncome),
        monthlyExpenses: Number(monthlyExpenses),
        riskTolerance,
      });

      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to save your profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Pressable style={styles.headerBackButton} onPress={handleCancelOnboarding} disabled={busy}>
        <Text style={styles.headerBackButtonText}>←</Text>
      </Pressable>
      <Text style={styles.eyebrow}>Onboarding</Text>
      <Text style={styles.title}>Let&apos;s set up your profile</Text>
      <Text style={styles.subtitle}>Step {step} of 3</Text>

      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.sectionTitle}>About you</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              style={styles.input}
            />
            <View style={styles.choiceRow}>
              {ageRanges.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.choice, ageRange === option && styles.choiceActive]}
                  onPress={() => setAgeRange(option)}
                >
                  <Text style={[styles.choiceText, ageRange === option && styles.choiceTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.sectionTitle}>Monthly cash flow</Text>
            <TextInput
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="decimal-pad"
              placeholder="Monthly income"
              style={styles.input}
            />
            <TextInput
              value={monthlyExpenses}
              onChangeText={setMonthlyExpenses}
              keyboardType="decimal-pad"
              placeholder="Monthly expenses"
              style={styles.input}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.sectionTitle}>Risk tolerance</Text>
            <View style={styles.choiceColumn}>
              {riskLevels.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.choiceWide, riskTolerance === option && styles.choiceActive]}
                  onPress={() => setRiskTolerance(option)}
                >
                  <Text style={[styles.choiceText, riskTolerance === option && styles.choiceTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <Pressable style={styles.secondaryBtn} onPress={() => setStep((current) => current - 1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={step === 3 ? submit : nextStep} disabled={busy}>
            <Text style={styles.primaryBtnText}>
              {busy ? 'Saving...' : step === 3 ? 'Finish' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headerBackButtonText: { fontSize: 20, fontWeight: '700', color: Colors.blue },
  eyebrow: { color: Colors.blue, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '700', marginTop: 10 },
  subtitle: { color: Colors.muted, marginTop: 8 },
  card: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choiceColumn: { gap: 10 },
  choice: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceWide: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  choiceActive: { borderColor: Colors.blue, backgroundColor: '#eef5ff' },
  choiceText: { color: '#111', fontWeight: '500' },
  choiceTextActive: { color: Colors.blue, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#111', fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  error: { color: Colors.red },
});
