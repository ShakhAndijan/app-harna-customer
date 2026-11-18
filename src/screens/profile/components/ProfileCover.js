import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import ProfileAvatar from './ProfileAvatar';
import ProfileInfo from './ProfileInfo';
import ThemeToggleButton from './ThemeToggleButton';
import ActivityStats from './ActivityStats';

// Profil ekranining tepa qismi: markazda katta rasm va ma'lumot, burchakda mavzu tugmasi,
// pastida suzib turuvchi faollik kartalari.
export default function ProfileCover({
  letter,
  avatarUri,
  avatarUploading,
  onAvatarPress,
  name,
  phone,
  location,
  stats,
  onEdit,
  onLocationPress,
  onOrdersPress,
  identityStatus,
  rating,
  onIdentityPress,
  onRatingPress,
}) {
  const { theme: t } = useTheme();

  return (
    <>
      <LinearGradient
        colors={[t.cover, t.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.cover}
      >
        <View style={[styles.glow, { backgroundColor: t.orange + '22' }]} />
        <View style={styles.toggle}>
          <ThemeToggleButton />
        </View>
        <View style={styles.center}>
          <ProfileAvatar
            letter={letter}
            uri={avatarUri}
            uploading={avatarUploading}
            onPress={onAvatarPress}
          />
          <ProfileInfo
            name={name}
            phone={phone}
            location={location}
            onEdit={onEdit}
            onLocationPress={onLocationPress}
            identityStatus={identityStatus}
            rating={rating}
            onIdentityPress={onIdentityPress}
            onRatingPress={onRatingPress}
          />
        </View>
      </LinearGradient>
      <ActivityStats stats={stats} onOrdersPress={onOrdersPress} />
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 58,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -110,
    alignSelf: 'center',
  },
  toggle: { alignItems: 'flex-end', zIndex: 2 },
  center: { alignItems: 'center', marginTop: -22 },
});
