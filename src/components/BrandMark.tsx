import { View, Text } from 'react-native';
import { Colors } from '../theme/colors';

export function BrandMark() {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 44, fontWeight: '900', letterSpacing: 2 }}>
        <Text style={{ color: Colors.blue }}>Z</Text>echer
      </Text>
      <Text style={{ letterSpacing: 6, marginTop: 6, color: Colors.muted, fontSize: 12 }}>FINANCIAL</Text>
    </View>
  );
}
