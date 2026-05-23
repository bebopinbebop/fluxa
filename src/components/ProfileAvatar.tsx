import { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { getProfileImageUrl } from '../lib/profileImage';
import { ProfileAvatarPlaceholder } from './ProfileAvatarPlaceholder';

type ProfileAvatarProps = {
  profileImageKey?: string | null;
  localUri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ profileImageKey, localUri, size = 42, style }: ProfileAvatarProps) {
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!profileImageKey) {
        setRemoteUri(null);
        return;
      }

      try {
        const url = await getProfileImageUrl(profileImageKey);
        if (mounted) {
          setRemoteUri(url);
        }
      } catch {
        if (mounted) {
          setRemoteUri(null);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [profileImageKey]);

  const uri = localUri ?? remoteUri;

  if (!uri) {
    return <ProfileAvatarPlaceholder size={size} style={style} />;
  }

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image source={{ uri }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
