import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { Colors } from '../../src/theme/colors';

type Msg = { id: string; from: 'me' | 'advisor'; text: string };

export default function ChatScreen() {
  const [draft, setDraft] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: '1', from: 'advisor', text: "Hey, I’m Jordan. Heard you needed some help?" },
    { id: '2', from: 'me', text: "Yeah! I just got a new job and they offer a 401k and i got no idea how that works..." },
    { id: '3', from: 'advisor', text: "A 401K is basically an account that you and your boss put money in, then you invest it over time." }
  ]);

  const list = useMemo(() => msgs.slice().reverse(), [msgs]);

  function send() {
    const t = draft.trim();
    if (!t) return;
    setMsgs((m) => [...m, { id: String(Date.now()), from: 'me', text: t }]);
    setDraft('');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your <Text style={{ color: Colors.blue }}>Financial Resource</Text></Text>
        <Text style={styles.headerSub}>Your Advisor is: <Text style={{ fontWeight: '700' }}>Jordan Schenkman</Text></Text>
      </View>

      <View style={styles.chatBox}>
        <FlatList
          inverted
          data={list}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'advisor' ? styles.advisorBubble : styles.meBubble]}>
              <Text style={[styles.bubbleText, item.from === 'advisor' && { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 12, gap: 10 }}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message Jordan and he’ll reply…"
          style={styles.input}
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>→</Text>
        </Pressable>
      </View>

      <View style={styles.schedule}>
        <Text style={{ color: Colors.muted }}>Schedule a Meeting with:</Text>
        <Text style={{ color: Colors.green, fontWeight: '800', marginTop: 4 }}>Jordan Schenkman</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: 16, paddingTop: 18 },
  header: { gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { color: Colors.muted },
  chatBox: { marginTop: 12, flex: 1, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', overflow: 'hidden' },
  bubble: { maxWidth: '82%', borderRadius: 18, padding: 12 },
  advisorBubble: { backgroundColor: '#000', alignSelf: 'flex-end' },
  meBubble: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  schedule: { marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, backgroundColor: '#fff' }
});
