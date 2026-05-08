import { View, StyleSheet } from 'react-native';
import { ConnectAccountDetails } from '../../../src/components/ConnectAccountDetails';
import { Colors } from '../../../src/theme/colors';

export default function ConnectAccount() {
  return (
    <View style={styles.screen}>
      <ConnectAccountDetails />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
});
