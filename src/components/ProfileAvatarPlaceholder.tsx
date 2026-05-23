import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type ProfileAvatarPlaceholderProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatarPlaceholder({ size = 42, style }: ProfileAvatarPlaceholderProps) {
  const headSize = size * 0.34;
  const shouldersWidth = size * 0.62;
  const shouldersHeight = size * 0.28;

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <View style={[styles.head, { width: headSize, height: headSize, borderRadius: headSize / 2 }]} />
      <View
        style={[
          styles.shoulders,
          {
            width: shouldersWidth,
            height: shouldersHeight,
            borderTopLeftRadius: shouldersHeight,
            borderTopRightRadius: shouldersHeight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  head: {
    backgroundColor: '#9CA3AF',
    marginBottom: 3,
  },
  shoulders: {
    backgroundColor: '#9CA3AF',
  },
});
