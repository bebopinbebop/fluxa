import { useRouter } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/useAuth';
import { getUserEmailUsername } from '../../src/auth/userIdentity';
import { CalendarDatePicker, todayDateString } from '../../src/components/CalendarDatePicker';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { uploadProfileImage } from '../../src/lib/profileImage';
import { pickProfileImage } from '../../src/lib/profileImagePicker';
import { validateEditableProfile } from '../../src/lib/profileValidation';
import { openPlaidLink } from '../../src/lib/plaidLink';
import { Colors } from '../../src/theme/colors';

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cancelOnboarding, completeOnboarding, refreshAppData } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);
  const [originalProfileImageKey, setOriginalProfileImageKey] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const phoneNumberInputRef = useRef<TextInput>(null);

  function nextProfileStep() {
    const validationError = validateEditableProfile({ name, dateOfBirth, phoneNumber });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep(2);
  }

  function resetForm() {
    setStep(1);
    setName('');
    setDateOfBirth('');
    setPhoneNumber('');
    setProfileImageKey(null);
    setOriginalProfileImageKey(null);
    setLocalImageUri(null);
    setError(null);
    setStatus(null);
  }

  async function handleCancelOnboarding() {
    if (busy || uploading) return;

    resetForm();
    setBusy(true);

    try {
      await cancelOnboarding();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to cancel onboarding.');
      setBusy(false);
    }
  }

  async function chooseProfileImage() {
    if (busy || uploading) return;

    setError(null);
    setStatus(null);

    let asset;
    try {
      asset = await pickProfileImage();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to open your photo library.');
      return;
    }

    if (!asset) return;

    setUploading(true);
    setLocalImageUri(asset.uri);

    try {
      const upload = await uploadProfileImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
      setProfileImageKey(upload.profileImageKey);
      setOriginalProfileImageKey(upload.originalProfileImageKey);
      setStatus('Image uploaded.');
    } catch (e: unknown) {
      setLocalImageUri(null);
      setError(e instanceof Error ? e.message : 'Unable to upload profile image.');
    } finally {
      setUploading(false);
    }
  }

  async function saveProfileAndContinue() {
    if (busy || uploading) return;

    const validationError = validateEditableProfile({ name, dateOfBirth, phoneNumber });
    if (validationError) {
      setError(validationError);
      setStep(1);
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const user = await getCurrentUser();
      const email = getUserEmailUsername(user);

      if (!email) {
        throw new Error('Unable to determine the signed-in user email.');
      }

      await completeOnboarding({
        email,
        name: name.trim(),
        dateOfBirth: dateOfBirth.trim(),
        phoneNumber: phoneNumber.trim(),
        profileImageKey,
        originalProfileImageKey,
      });

      setStatus(null);
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to save your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function connectBank() {
    if (busy) return;

    setError(null);
    setBusy(true);

    try {
      const result = await openPlaidLink({
        onStatus: setStatus,
        onExit: () => setStatus(null),
      });

      if (result === 'exited') {
        return;
      }

      await refreshAppData();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to open Plaid Link.';
      setError(
        message.includes('NativeModule') || message.includes('TurboModule')
          ? 'Plaid Link needs a development build or native app build. It will not run in Expo Go.'
          : message
      );
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function finishWithoutBank() {
    if (busy) return;

    setError(null);
    setStatus(null);
    await refreshAppData();
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Pressable style={styles.headerBackButton} onPress={handleCancelOnboarding} disabled={busy || uploading}>
        <Text style={styles.headerBackButtonText}>←</Text>
      </Pressable>
      <Text style={styles.eyebrow}>Onboarding</Text>
      <Text style={styles.title}>Let&apos;s set up your profile</Text>
      <Text style={styles.subtitle}>Step {step} of {TOTAL_STEPS}</Text>

      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.sectionTitle}>Profile details</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              placeholder="Name"
              style={styles.input}
            />
            <CalendarDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="Date of birth (YYYY-MM-DD)"
              maximumDate={todayDateString()}
              style={styles.input}
            />
            <TextInput
              ref={phoneNumberInputRef}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              returnKeyType="go"
              onSubmitEditing={nextProfileStep}
              placeholder="Phone number"
              style={styles.input}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.sectionTitle}>Profile image</Text>
            <ProfileAvatar size={104} profileImageKey={profileImageKey} localUri={localImageUri} style={styles.avatar} />
            <Pressable style={[styles.primaryBtn, (busy || uploading) && styles.disabled]} onPress={chooseProfileImage} disabled={busy || uploading}>
              <Text style={styles.primaryBtnText}>{uploading ? 'Uploading...' : 'Upload Image'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={saveProfileAndContinue} disabled={busy || uploading}>
              <Text style={styles.secondaryBtnText}>{localImageUri ? 'Continue' : 'Skip'}</Text>
            </Pressable>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.sectionTitle}>Connect your bank</Text>
            <View style={styles.plaidBox}>
              <Text style={styles.plaidLogo}>F</Text>
              <Text style={styles.plaidTitle}>Plaid Link</Text>
              <Text style={styles.plaidCopy}>
                Securely connect a bank account so Fluxa can start syncing balances, accounts, and transactions.
              </Text>
            </View>
          </>
        ) : null}

        {status ? <Text style={styles.success}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step !== 2 ? (
          <View style={styles.actions}>
            {step > 1 && step < 3 ? (
              <Pressable style={styles.secondaryBtn} onPress={() => setStep((current) => current - 1)}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.primaryBtn} onPress={step === 3 ? connectBank : nextProfileStep} disabled={busy || uploading}>
              <Text style={styles.primaryBtnText}>
                {busy ? 'Working...' : step === 3 ? 'Connect bank' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === 3 ? (
          <Pressable style={styles.notNowDialog} onPress={finishWithoutBank} disabled={busy}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        ) : null}
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
  avatar: { alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
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
  disabled: { opacity: 0.6 },
  plaidBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    padding: 18,
  },
  plaidLogo: { fontSize: 42, fontWeight: '900', color: Colors.blue },
  plaidTitle: { marginTop: 6, fontSize: 20, fontWeight: '900', color: '#111827' },
  plaidCopy: { marginTop: 8, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  notNowDialog: {
    marginTop: 2,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  notNowText: { color: Colors.muted, fontWeight: '800' },
  success: { color: Colors.green, fontWeight: '700' },
  error: { color: Colors.red },
});
