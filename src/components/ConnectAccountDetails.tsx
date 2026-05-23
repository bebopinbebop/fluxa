import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { createPlaidLinkToken, exchangePlaidPublicToken } from '../lib/plaidApi';
import { Colors } from '../theme/colors';
import { useAuth } from '../auth/useAuth';
import { usePullToRefresh } from './PullToRefresh';

const sandboxPersonas = [
  {
    label: 'Excellent',
    value: 'user_credit_profile_excellent',
    hint: 'Use username user_credit_profile_excellent and any password.',
  },
  {
    label: 'Poor',
    value: 'user_credit_profile_poor',
    hint: 'Use username user_credit_profile_poor and any password.',
  },
  {
    label: 'Dynamic',
    value: 'user_transactions_dynamic',
    hint: 'Use username user_transactions_dynamic and any password.',
  },
];

export function ConnectAccountDetails() {
  const pullToRefresh = usePullToRefresh();
  const { profile, refreshBankConnection, refreshFinancialSnapshot, refreshTransactions } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState('');
  const [institutionId, setInstitutionId] = useState('ins_109508');
  const [institutionName, setInstitutionName] = useState('First Platypus Bank');
  const [linkSessionId, setLinkSessionId] = useState('');
  const [sandboxPersona, setSandboxPersona] = useState(defaultPersonaForEmail(profile?.email));
  const institutionIdInputRef = useRef<TextInput>(null);
  const institutionNameInputRef = useRef<TextInput>(null);
  const linkSessionIdInputRef = useRef<TextInput>(null);

  const selectedPersona = sandboxPersonas.find((persona) => persona.value === sandboxPersona) ?? sandboxPersonas[0];
  const isReadyToExchange = useMemo(() => {
    return Boolean(publicToken.trim() && institutionId.trim());
  }, [publicToken, institutionId]);

  async function handlePlaidSuccess(publicTokenValue: string, metadata: any) {
    console.log('[PlaidFlow][App:ConnectAccount] Plaid success received', {
      publicTokenPreview: maskToken(publicTokenValue),
      institutionId: metadata?.institution?.id ?? institutionId.trim(),
      institutionName: metadata?.institution?.name ?? institutionName.trim(),
      linkSessionId: metadata?.linkSessionId ?? linkSessionId.trim(),
      selectedAccountCount: metadata?.accounts?.length ?? 0,
      sandboxPersona,
      metadata: sanitizeForLog(metadata),
    });

    setStatus('Saving connected account...');

    await exchangePlaidPublicToken(publicTokenValue, {
      institution: {
        institution_id: metadata?.institution?.id ?? institutionId.trim(),
        name: metadata?.institution?.name ?? (institutionName.trim() || undefined),
      },
      link_session_id: metadata?.linkSessionId ?? (linkSessionId.trim() || undefined),
      accounts: metadata?.accounts ?? [],
      sandbox_persona: sandboxPersona,
    });

    console.log('[PlaidFlow][App:ConnectAccount] public token exchange complete; refreshing transactions');
    await refreshBankConnection();
    await refreshTransactions(profile?.email);
    console.log('[PlaidFlow][App:ConnectAccount] transactions refreshed; refreshing financial snapshot');
    await refreshFinancialSnapshot();
    console.log('[PlaidFlow][App:ConnectAccount] financial snapshot refreshed');
    setStatus('Account connected and transactions synced.');
  }

  async function onAddAccount() {
    console.log('[PlaidFlow][App:ConnectAccount] Add Account pressed', {
      email: profile?.email ?? null,
      sandboxPersona,
    });

    setBusy(true);
    setError(null);
    setStatus('Creating Plaid Link session...');

    try {
      const result = await createPlaidLinkToken();
      console.log('[PlaidFlow][App:ConnectAccount] importing Plaid Link SDK');
      const plaid = await import('react-native-plaid-link-sdk');

      console.log('[PlaidFlow][App:ConnectAccount] creating Plaid Link instance', {
        hasLinkToken: Boolean(result.link_token),
      });
      await plaid.destroy?.();
      plaid.create({ token: result.link_token });
      console.log('[PlaidFlow][App:ConnectAccount] opening Plaid Link');
      plaid.open({
        onSuccess: async (success) => {
          try {
            console.log('[PlaidFlow][App:ConnectAccount] Plaid Link onSuccess callback');
            await handlePlaidSuccess(success.publicToken, success.metadata);
          } catch (e: any) {
            console.log('[PlaidFlow][App:ConnectAccount] Plaid Link success handling failed', {
              message: e?.message,
            });
            setError(e?.message ?? 'Plaid account connected, but saving it failed.');
          } finally {
            setBusy(false);
          }
        },
        onExit: (exit) => {
          console.log('[PlaidFlow][App:ConnectAccount] Plaid Link onExit callback', {
            errorCode: exit?.error?.errorCode ?? null,
            errorMessage: exit?.error?.errorMessage ?? null,
            linkSessionId: exit?.metadata?.linkSessionId ?? null,
            institutionId: exit?.metadata?.institution?.id ?? null,
          });
          setBusy(false);
          setStatus(null);

          if (exit?.error?.errorMessage) {
            setError(exit.error.errorMessage);
          }
        },
      });
    } catch (e: any) {
      console.log('[PlaidFlow][App:ConnectAccount] Add Account failed before/during Link open', {
        message: e?.message,
      });
      setBusy(false);
      setStatus(null);
      setError(
        e?.message?.includes('NativeModule') || e?.message?.includes('TurboModule')
          ? 'Plaid Link needs a development build or native app build. It will not run in Expo Go.'
          : e?.message ?? 'Unable to open Plaid Link.'
      );
    }
  }

  async function onExchangeToken() {
    console.log('[PlaidFlow][App:ConnectAccount] manual public token exchange pressed', {
      publicTokenPreview: maskToken(publicToken.trim()),
      institutionId: institutionId.trim(),
      institutionName: institutionName.trim(),
      linkSessionId: linkSessionId.trim(),
      sandboxPersona,
    });

    setBusy(true);
    setError(null);
    setStatus('Saving sandbox public token...');

    try {
      await handlePlaidSuccess(publicToken.trim(), {
        institution: {
          id: institutionId.trim(),
          name: institutionName.trim() || undefined,
        },
        linkSessionId: linkSessionId.trim() || undefined,
        accounts: [],
      });
      setPublicToken('');
      setLinkSessionId('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to exchange public token.');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      {pullToRefresh.indicator}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
      >
        <Text style={styles.subtitle}>Connect bank accounts securely with Plaid</Text>

      <View style={styles.logoBox}>
        <Text style={{ fontSize: 44, fontWeight: '900', color: Colors.blue }}>F</Text>
        <Text style={{ marginTop: 8, fontSize: 26, fontWeight: '900', color: '#111827' }}>Plaid Link</Text>
      </View>

      <Pressable style={[styles.addAccountButton, busy && { opacity: 0.65 }]} onPress={onAddAccount} disabled={busy}>
        <Text style={styles.addAccountButtonText}>{busy ? 'Working...' : 'Add Account'}</Text>
      </Pressable>

      <View style={styles.sandboxCard}>
        <Text style={styles.sandboxTitle}>Sandbox test profile</Text>
        <View style={styles.personaRow}>
          {sandboxPersonas.map((persona) => (
            <Pressable
              key={persona.value}
              style={[styles.personaChip, sandboxPersona === persona.value && styles.personaChipActive]}
              onPress={() => setSandboxPersona(persona.value)}
            >
              <Text style={[styles.personaChipText, sandboxPersona === persona.value && styles.personaChipTextActive]}>
                {persona.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sandboxHint}>{selectedPersona.hint}</Text>
        <Text style={styles.sandboxHint}>Institution: First Platypus Bank</Text>
      </View>

      {status ? <Text style={styles.success}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sandbox public token fallback</Text>
        <TextInput
          value={publicToken}
          onChangeText={setPublicToken}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => institutionIdInputRef.current?.focus()}
          placeholder="public-token-from-plaid-link"
          style={styles.input}
        />
        <TextInput
          ref={institutionIdInputRef}
          value={institutionId}
          onChangeText={setInstitutionId}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => institutionNameInputRef.current?.focus()}
          placeholder="institution_id"
          style={styles.input}
        />
        <TextInput
          ref={institutionNameInputRef}
          value={institutionName}
          onChangeText={setInstitutionName}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => linkSessionIdInputRef.current?.focus()}
          placeholder="institution name"
          style={styles.input}
        />
        <TextInput
          ref={linkSessionIdInputRef}
          value={linkSessionId}
          onChangeText={setLinkSessionId}
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={onExchangeToken}
          placeholder="link_session_id (optional)"
          style={styles.input}
        />

        <Pressable
          style={[styles.secondaryBtn, (!isReadyToExchange || busy) && { opacity: 0.5 }]}
          onPress={onExchangeToken}
          disabled={busy || !isReadyToExchange}
        >
          <Text style={styles.secondaryBtnText}>Exchange Public Token</Text>
        </Pressable>
      </View>

        <Text style={styles.note}>
          Cognito owns the user. Plaid creates Items after Link. Fluxa joins them by saving each Plaid Item under the signed-in Cognito owner.
        </Text>
      </ScrollView>
    </View>
  );
}

function maskToken(token: string) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 12)}...${token.slice(-6)}`;
}

function sanitizeForLog(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (key, nestedValue) => {
      if (key.toLowerCase().includes('token')) {
        return typeof nestedValue === 'string' ? maskToken(nestedValue) : '[REDACTED]';
      }

      return nestedValue;
    })
  );
}

function defaultPersonaForEmail(email?: string | null) {
  return email?.trim().toLowerCase() === 'llcauquil@proton.me'
    ? 'user_credit_profile_poor'
    : 'user_credit_profile_excellent';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 0, paddingBottom: 40, alignItems: 'center' },
  subtitle: { color: Colors.muted, textAlign: 'center' },
  logoBox: { marginTop: 20, alignItems: 'center', justifyContent: 'center', height: 132 },
  addAccountButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountButtonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  sandboxCard: {
    width: '100%',
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
  },
  sandboxTitle: { fontWeight: '900', marginBottom: 10 },
  personaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  personaChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  personaChipActive: { borderColor: Colors.blue, backgroundColor: '#EFF6FF' },
  personaChipText: { color: Colors.muted, fontSize: 12, fontWeight: '800' },
  personaChipTextActive: { color: Colors.blue },
  sandboxHint: { color: Colors.muted, fontSize: 12, lineHeight: 18 },
  section: { marginTop: 18, width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  secondaryBtn: { marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center', width: '100%', backgroundColor: '#fff' },
  secondaryBtnText: { color: '#111827', fontWeight: '800' },
  note: { marginTop: 16, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  success: { marginTop: 12, color: Colors.green, fontWeight: '700', textAlign: 'center' },
  error: { marginTop: 12, color: Colors.red, textAlign: 'center' },
});
