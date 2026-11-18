import { useState } from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useIsFocused } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import AvatarPickerSheet from '../components/AvatarPickerSheet';
import useProfileStats from './profile/hooks/useProfileStats';
import useAvatarActions from './profile/hooks/useAvatarActions';
import { useUnreadNotifications } from '../queries/notifications';
import { getIdentityStatus } from '../api/account';
import { getCustomerMe, updateCustomerMe } from '../api/user';
import AddressEditor from './addresses/components/AddressEditor';
import { primaryFromMe } from './addresses/hooks/useAddresses';
import { formatPhoneDisplay } from './profile/utils';
import ProfileCover from './profile/components/ProfileCover';
import IncompleteProfileBanner from './profile/components/IncompleteProfileBanner';
import MenuCard from './profile/components/MenuCard';
import useTabBarSpace from '../navigation/useTabBarSpace';
import { listingsRoute } from '../navigation/params';
import { FEATURES } from '../constants/config';

// Mijoz profili (pastki menyudagi "profile" tabi): tepada rasm/ma'lumot/statistika, so'ng hamyon va
// menyular. Menyudagi sahifalar alohida marshrutlar (src/app/): router.push bilan ochiladi.
export default function ZakazchiProfileScreen() {
  const bottomSpace = useTabBarSpace(90);
  const router = useRouter();
  const { signOut } = useAuth();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const { user, refreshUser } = useUser();
  const queryClient = useQueryClient();

  // Manzil oynasi: buyurtmadagi kabi xaritali oyna; asosiy manzil profilga (backendga) saqlanadi.
  const [addressOpen, setAddressOpen] = useState(false);

  // Profil sahifalaridan qaytilganda statistika qayta yuklanadi.
  const focused = useIsFocused();
  const stats = useProfileStats(focused);
  const unreadNotifs = useUnreadNotifications();
  const identity = useQuery({
    queryKey: ['identity', 'status'],
    queryFn: getIdentityStatus,
    enabled: focused,
    staleTime: 30 * 1000,
  });
  const identityStatus = identity.data?.submission_status;
  const avatar = useAvatarActions();

  // Ism yoki telefon kelmasa, bo'sh qoldiriladi (zaxira matn yo'q).
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const displayLetter = (displayName[0] || '?').toUpperCase();
  const displayPhone = user?.phone ? formatPhoneDisplay(user.phone) : '';
  const displayAvatarUri = avatar.previewUri || user?.profile_photo || null;
  const displayLocation = [user?.district, user?.region].filter(Boolean).join(', ');

  const meQuery = useQuery({ queryKey: ['customer', 'me'], queryFn: getCustomerMe });
  const openAddress = () => setAddressOpen(true);
  const saveAddress = async (address) => {
    await updateCustomerMe({
      region_id: address.regionId,
      district_id: address.districtId,
      address: address.street.trim() || null,
      default_gps_lat: address.lat,
      default_gps_lng: address.lng,
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customer', 'me'] }),
      refreshUser(),
    ]);
    setAddressOpen(false);
  };

  const go = (path) => () => router.push(path);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
      >
        <ProfileCover
          letter={displayLetter}
          avatarUri={displayAvatarUri}
          avatarUploading={avatar.uploading}
          onAvatarPress={avatar.openSheet}
          name={displayName}
          phone={displayPhone}
          location={displayLocation}
          stats={stats}
          identityStatus={identityStatus}
          rating={stats.rating}
          onIdentityPress={go('/verify-identity')}
          onRatingPress={go('/my-rating')}
          onEdit={go('/edit-profile')}
          onLocationPress={openAddress}
          onOrdersPress={go('/orders')}
        />

        {!displayLocation && <IncompleteProfileBanner onPress={openAddress} />}

        <MenuCard
          title={tr('profile.groups.activity')}
          style={{ paddingTop: 24 }}
          rows={[
            {
              icon: 'format-list-bulleted',
              label: tr('profile.menu.orderHistory'),
              value:
                stats.orders != null
                  ? tr('profile.menu.itemCount', { n: stats.orders })
                  : undefined,
              color: t.blue,
              onPress: go('/orders'),
            },
            {
              icon: 'heart-outline',
              label: tr('favorites.title'),
              value:
                stats.favorites != null
                  ? tr('profile.menu.itemCount', { n: stats.favorites })
                  : undefined,
              color: t.red,
              onPress: go('/favorites'),
            },
            ...(FEATURES.savedAddresses
              ? [
                  {
                    icon: 'map-marker-outline',
                    label: tr('profile.menu.myAddresses'),
                    color: t.green,
                    onPress: go('/addresses'),
                  },
                ]
              : []),
            {
              icon: 'bookmark-outline',
              label: tr('listings.menuSaved'),
              color: t.orange,
              onPress: () => router.push(listingsRoute({ saved: true })),
            },
          ]}
        />

        <MenuCard
          title={tr('profile.groups.account')}
          style={{ paddingTop: 20 }}
          rows={[
            {
              icon: 'shield-star-outline',
              label: tr('account.menu.rating'),
              value:
                stats.badge && stats.badge !== 'none'
                  ? tr(`account.level.${stats.badge}`)
                  : undefined,
              color: t.gold,
              onPress: go('/my-rating'),
            },
            {
              icon: 'domain',
              label: tr('business.menu'),
              color: t.blue,
              onPress: go('/company'),
            },
            {
              icon: 'shield-lock-outline',
              label: tr('profile.menu.security'),
              value: identityStatus === 'approved' ? tr('account.identityApproved') : undefined,
              color: t.green,
              onPress: go('/security'),
            },
          ]}
        />

        <MenuCard
          title={tr('profile.groups.support')}
          style={{ paddingTop: 20 }}
          rows={[
            {
              icon: 'cog-outline',
              label: tr('profile.menu.settings'),
              value: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
              color: unreadNotifs > 0 ? t.orange : undefined,
              onPress: go('/settings'),
            },
            {
              icon: 'help-circle-outline',
              label: tr('profile.menu.help'),
              color: t.blue,
              onPress: go('/help-menu'),
            },
          ]}
        />

        <MenuCard
          style={{ paddingTop: 20 }}
          rows={[{ icon: 'logout', label: tr('profile.logout'), danger: true, onPress: signOut }]}
        />
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: t.faint,
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          {tr('profile.footer')}
        </Text>
      </ScrollView>

      {addressOpen && (
        <AddressEditor
          mode="primary"
          initial={primaryFromMe(meQuery.data)}
          onClose={() => setAddressOpen(false)}
          onSave={saveAddress}
          t={t}
          tr={tr}
        />
      )}
      <AvatarPickerSheet
        visible={avatar.sheetOpen}
        onClose={avatar.closeSheet}
        onPickCamera={avatar.pickCamera}
        onPickGallery={avatar.pickGallery}
        onRemove={avatar.remove}
        hasPhoto={!!displayAvatarUri}
        previewUri={displayAvatarUri}
        previewLetter={displayLetter}
        previewColor={t.orange}
        t={t}
      />
    </SafeAreaView>
  );
}
