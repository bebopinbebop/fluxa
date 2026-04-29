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

type SlidingOverlayCardProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  titleColor: string;
  topInset?: number;
  bottomInset?: number;
  sideInset?: number;
  direction?: 'left' | 'right';
};

export function SlidingOverlayCard({
  visible,
  onClose,
  children,
  title,
  titleColor,
  topInset = 24,
  bottomInset = 24,
  sideInset = 20,
  direction = 'left',
}: SlidingOverlayCardProps) {
  const [mounted, setMounted] = useState(visible);
  const initialOffset = direction === 'left' ? -420 : 420;
  const translateX = useRef(new Animated.Value(initialOffset)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.setValue(initialOffset);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: initialOffset,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, initialOffset, translateX, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            {
              top: topInset,
              right: sideInset,
              bottom: bottomInset,
              left: sideInset,
              transform: [{ translateX }],
            },
          ]}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'center' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },
  card: {
    position: 'absolute',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(231, 231, 231, 0.95)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 18,
    zIndex: 2,
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  headerRow: {
    minHeight: 64,
    paddingTop: 18,
    paddingLeft: 54,
    paddingRight: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
});
