import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useAuth } from '../auth/useAuth';
import { getUserEmailUsername } from '../auth/userIdentity';
import { uploadProfileImage } from '../lib/profileImage';
import { pickProfileImage } from '../lib/profileImagePicker';
import { validateEditableProfile } from '../lib/profileValidation';
import { Colors } from '../theme/colors';
import { CalendarDatePicker, todayDateString } from './CalendarDatePicker';
import { ProfileAvatar } from './ProfileAvatar';
import { usePullToRefresh } from './PullToRefresh';

type SettingsDetailsProps = {
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function SettingsDetails({
  containerStyle,
  contentContainerStyle,
}: SettingsDetailsProps) {
  const pullToRefresh = usePullToRefresh();
  const { profile, signOut, updateProfile, user } = useAuth();
  const emailUsername = (profile?.email ?? getUserEmailUsername(user)) || 'Unavailable';
  const displayName = profile?.name?.trim() || profile?.firstName?.trim() || 'User';
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <View style={[styles.container, containerStyle]}>
      {pullToRefresh.indicator}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        onScroll={pullToRefresh.onScroll}
        onScrollEndDrag={pullToRefresh.onScrollEndDrag}
        scrollEventThrottle={pullToRefresh.scrollEventThrottle}
        bounces
        alwaysBounceVertical
      >
        <Text style={styles.title}>{displayName}</Text>

        <View style={styles.avatarWrap}>
          <ProfileAvatar
            size={92}
            profileImageKey={profile?.profileImageKey}
            style={styles.avatar}
          />
          <Pressable style={styles.editAvatarButton} onPress={() => setIsEditOpen(true)}>
            <Text style={styles.editAvatarIcon}>✎</Text>
          </Pressable>
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}

        <View style={styles.profileRows}>
          <ProfileRow label="Name" value={displayName} />
          <ProfileRow label="Date of birth" value={profile?.dateOfBirth || 'Not set'} />
          <ProfileRow label="Phone" value={profile?.phoneNumber || 'Not set'} />
          <ProfileRow label="Username" value={emailUsername} />
          <ProfileRow label="Email" value={emailUsername} />
        </View>

        <Text style={styles.section}>Linked Accounts</Text>
        {['Bank of America', 'Chase', 'TD Ameritrade', 'Gerber Life Insurance', 'American Express', 'Vanguard'].map((n) => (
          <View key={n} style={styles.accountRow}>
            <View style={styles.iconStub} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{n}</Text>
              <Text style={{ color: Colors.muted, marginTop: 2 }}>Account details...</Text>
            </View>
          </View>
        ))}

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        visible={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => {
          setIsEditOpen(false);
          setMessage('Profile updated.');
        }}
        profile={profile}
        updateProfile={updateProfile}
      />
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.readOnlyText}>{value}</Text>
    </View>
  );
}

function EditProfileModal({
  visible,
  onClose,
  onSaved,
  profile,
  updateProfile,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  profile: ReturnType<typeof useAuth>['profile'];
  updateProfile: ReturnType<typeof useAuth>['updateProfile'];
}) {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);
  const [originalProfileImageKey, setOriginalProfileImageKey] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    setName(profile?.name ?? profile?.firstName ?? '');
    setDateOfBirth(profile?.dateOfBirth ?? '');
    setPhoneNumber(profile?.phoneNumber ?? '');
    setProfileImageKey(profile?.profileImageKey ?? null);
    setOriginalProfileImageKey(profile?.originalProfileImageKey ?? null);
    setLocalImageUri(null);
    setMessage(null);
    setError(null);
    setSaving(false);
    setUploading(false);
  }, [profile, visible]);

  async function chooseProfileImage() {
    if (uploading || saving) return;

    setError(null);
    setMessage(null);

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
      setMessage('Image uploaded. Save changes to keep it.');
    } catch (e: unknown) {
      setLocalImageUri(null);
      setError(e instanceof Error ? e.message : 'Unable to upload profile image.');
    } finally {
      setUploading(false);
    }
  }

  async function saveChanges() {
    if (saving || uploading) return;

    if (!profile?.id) {
      setError('Profile is still loading. Try again in a moment.');
      return;
    }

    const validationError = validateEditableProfile({ name, dateOfBirth, phoneNumber });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateProfile({
        id: profile.id,
        name: name.trim(),
        dateOfBirth: dateOfBirth.trim(),
        phoneNumber: phoneNumber.trim(),
        profileImageKey,
        originalProfileImageKey,
      });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.editModal}>
          <Pressable style={styles.modalCloseButton} onPress={onClose} disabled={saving || uploading}>
            <Text style={styles.modalCloseText}>×</Text>
          </Pressable>

          <Text style={styles.modalTitle}>Edit Profile</Text>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ProfileAvatar
              size={96}
              profileImageKey={profileImageKey}
              localUri={localImageUri}
              style={styles.modalAvatar}
            />
            <Pressable style={styles.uploadButton} onPress={chooseProfileImage} disabled={uploading || saving}>
              <Text style={styles.uploadButtonText}>{uploading ? 'Uploading image...' : 'Upload Image'}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              placeholder="Name"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Date of birth</Text>
            <CalendarDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              maximumDate={todayDateString()}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              returnKeyType="go"
              onSubmitEditing={saveChanges}
              placeholder="+1 555 123 4567"
              style={styles.input}
            />

            {message ? <Text style={styles.modalSuccess}>{message}</Text> : null}
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            style={[styles.saveChangesButton, (saving || uploading) && styles.disabled]}
            onPress={saveChanges}
            disabled={saving || uploading}
          >
            <Text style={styles.saveChangesText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  contentContainer: { padding: 16, paddingTop: 18, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  avatarWrap: { marginTop: 14 },
  avatar: {},
  editAvatarButton: {
    position: 'absolute',
    right: -2,
    top: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarIcon: { color: Colors.muted, fontSize: 16, fontWeight: '900' },
  profileRows: { width: '100%', marginTop: 18 },
  readOnlyRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { color: Colors.muted, fontWeight: '700' },
  readOnlyText: { maxWidth: '62%', textAlign: 'right' },
  success: { width: '100%', marginTop: 12, color: Colors.green, fontWeight: '700', textAlign: 'center' },
  section: { width: '100%', marginTop: 18, fontWeight: '900' },
  accountRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  iconStub: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eee' },
  signOut: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  editModal: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    left: 18,
    zIndex: 3,
  },
  modalCloseText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalTitle: {
    minHeight: 62,
    paddingTop: 18,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  modalScroll: { maxHeight: 520 },
  modalContent: { paddingHorizontal: 16, paddingBottom: 18, alignItems: 'stretch' },
  modalAvatar: { alignSelf: 'center', marginTop: 2 },
  uploadButton: {
    alignSelf: 'center',
    marginTop: 10,
    minHeight: 34,
    justifyContent: 'center',
  },
  uploadButtonText: { color: Colors.blue, fontWeight: '800' },
  fieldLabel: { marginTop: 12, color: Colors.muted, fontSize: 12, fontWeight: '800' },
  input: {
    width: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#fff',
    fontWeight: '600',
  },
  modalSuccess: { marginTop: 12, color: Colors.green, fontWeight: '700' },
  modalError: { marginTop: 12, color: Colors.red },
  saveChangesButton: {
    margin: 16,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveChangesText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
