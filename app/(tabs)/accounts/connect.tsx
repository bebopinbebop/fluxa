import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Colors } from '../../../src/theme/colors';
import { useRouter } from 'expo-router';
import { createPlaidLinkToken, exchangePlaidPublicToken } from '../../../src/lib/plaidApi';

export default function ConnectAccount() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [publicToken, setPublicToken] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [linkSessionId, setLinkSessionId] = useState('');

  const isReadyToExchange = useMemo(() => {
    return Boolean(publicToken.trim() && institutionId.trim());
  }, [publicToken, institutionId]);

  async function onCreateLinkToken() {
    setBusy(true);
    setError(null);
    try {
      const result = await createPlaidLinkToken(bearerToken);
      setLinkToken(result.link_token);
      console.log('[Plaid] Link token created', { hasToken: Boolean(result.link_token) });
    } catch (e: any) {
      const message = e?.message ?? 'Failed to create Plaid link token.';
      setError(message);
      console.error('[Plaid] Link token error', e);
    } finally {
      setBusy(false);
    }
  }

  async function onExchangeToken() {
    setBusy(true);
    setError(null);
    try {
      await exchangePlaidPublicToken(
        publicToken.trim(),
        {
          institution: {
            institution_id: institutionId.trim(),
            name: institutionName.trim() || undefined,
          },
          link_session_id: linkSessionId.trim() || undefined,
          accounts: [],
        },
        bearerToken
      );
      console.log('[Plaid] Public token exchanged');
      setPublicToken('');
      setInstitutionId('');
      setInstitutionName('');
      setLinkSessionId('');
    } catch (e: any) {
      const message = e?.message ?? 'Failed to exchange public token.';
      setError(message);
      console.error('[Plaid] Exchange token error', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ fontSize: 22 }}>←</Text>
      </Pressable>

      <Text style={styles.title}>Connect your Account</Text>
      <Text style={styles.subtitle}>Connect your accounts securely with Plaid</Text>

      <View style={styles.logoBox}>
        <Text style={{ fontSize: 44, fontWeight: '900', color: Colors.blue }}>ZF</Text>
        <Text style={{ marginTop: 10, fontSize: 24, fontWeight: '800' }}>⌁</Text>
      </View>

      <TextInput
        value={bearerToken}
        onChangeText={setBearerToken}
        autoCapitalize="none"
        placeholder="Optional Bearer JWT (if your API is protected)"
        style={styles.input}
      />

      <Pressable style={styles.primaryBtn} onPress={onCreateLinkToken} disabled={busy}>
        <Text style={styles.primaryBtnText}>{busy ? 'Working…' : 'Create Plaid Link Token'}</Text>
      </Pressable>

      {linkToken ? <Text style={styles.success}>Link token created: {linkToken}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exchange Public Token</Text>
        <TextInput
          value={publicToken}
          onChangeText={setPublicToken}
          autoCapitalize="none"
          placeholder="public-token-from-plaid-link"
          style={styles.input}
        />
        <TextInput
          value={institutionId}
          onChangeText={setInstitutionId}
          autoCapitalize="none"
          placeholder="institution_id (required)"
          style={styles.input}
        />
        <TextInput
          value={institutionName}
          onChangeText={setInstitutionName}
          autoCapitalize="none"
          placeholder="institution name (optional)"
          style={styles.input}
        />
        <TextInput
          value={linkSessionId}
          onChangeText={setLinkSessionId}
          autoCapitalize="none"
          placeholder="link_session_id (optional)"
          style={styles.input}
        />

        <Pressable
          style={[styles.primaryBtn, !isReadyToExchange && { opacity: 0.5 }]}
          onPress={onExchangeToken}
          disabled={busy || !isReadyToExchange}
        >
          <Text style={styles.primaryBtnText}>{busy ? 'Working…' : 'Exchange Public Token'}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.note}>
        This screen is wired to the AWS Plaid demo API contract (`GET/POST /v1/tokens`). Next step is connecting a native Plaid Link SDK flow to automatically produce `public_token` and metadata.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingTop: 18, paddingBottom: 40, alignItems: 'center' },
  back: { alignSelf: 'flex-start' },
  title: { marginTop: 12, fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, color: Colors.muted },
  logoBox: { marginTop: 50, alignItems: 'center', justifyContent: 'center', height: 220 },
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
    marginTop: 10
  },
  primaryBtn: { backgroundColor: '#111', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  note: { marginTop: 16, color: Colors.muted, textAlign: 'center' },
  success: { marginTop: 12, color: '#0b7a28', fontWeight: '600' },
  error: { marginTop: 12, color: Colors.red, textAlign: 'center' }
});
