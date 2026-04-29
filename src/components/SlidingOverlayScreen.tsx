import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SlidingOverlayScreenProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  topInset?: number;
};

export function SlidingOverlayScreen({
  visible,
  onClose,
  children,
  title,
  topInset = 0,
}: SlidingOverlayScreenProps) {
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(-900)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(-900);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: -900,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [translateY, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.screen,
          {
            paddingTop: topInset,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{title ?? ''}</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
  },
  closeButton: {
    width: 24,
    alignItems: 'flex-end',
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});
