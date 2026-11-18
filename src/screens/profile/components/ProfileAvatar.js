import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Avatar from '../../../components/Avatar';
import { useTheme } from '../../../context/ThemeContext';

const SIZE = 96;

// Profil rasmi: bosilsa tanlash oynasi ochiladi; yuklanayotganda aylanuvchi indikator, burchakda kamera belgisi.
// Atrofida yumshoq halqa (rasm "ko'tarilib" turgandek ko'rinadi).
export default function ProfileAvatar({ letter, uri, uploading, onPress }) {
  const { theme: t } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.ring, { borderColor: t.orange + '55', backgroundColor: t.bg + '66' }]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={uploading}
      accessibilityRole="button"
    >
      <Avatar letter={letter} size={SIZE} bgColor={t.orange} uri={uri} />
      {uploading && (
        <View style={[styles.overlay, { borderRadius: SIZE * 0.32 }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <View style={[styles.badge, { backgroundColor: t.orange, borderColor: t.cover }]}>
        <MaterialCommunityIcons name="camera" size={14} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'relative',
    padding: 5,
    borderRadius: SIZE * 0.32 + 5,
    borderWidth: 1.5,
  },
  overlay: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: SIZE,
    height: SIZE,
    backgroundColor: 'rgba(10,19,34,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
