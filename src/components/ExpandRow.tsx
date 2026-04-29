import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function ExpandRow({
  title,
  value,
  tone,
  expanded: expandedProp,
  children
}: {
  title: string;
  value: string;
  tone: 'green' | 'red';
  expanded?: boolean;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(!!expandedProp);
  const arrowRotation = useRef(new Animated.Value(expandedProp ? 1 : 0)).current;
  const color = tone === 'green' ? Colors.green : Colors.red;

  useEffect(() => {
    Animated.timing(arrowRotation, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [arrowRotation, expanded]);

  const arrowSpin = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  function toggleExpanded() {
    LayoutAnimation.configureNext({
      duration: 220,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setExpanded((value) => !value);
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.row} onPress={toggleExpanded}>
        <View style={[styles.icon, { backgroundColor: color + '22' }]}>
          <Text style={{ fontWeight: '900' }}>{title.slice(0, 1)}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Animated.Text
          style={[
            styles.arrow,
            {
              transform: [{ rotate: arrowSpin }],
            },
          ]}
        >
          ˅
        </Animated.Text>
      </Pressable>
      {expanded && children ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '900' },
  value: { fontWeight: '900' },
  arrow: { marginLeft: 8, color: Colors.muted, fontSize: 16, lineHeight: 16 }
});
