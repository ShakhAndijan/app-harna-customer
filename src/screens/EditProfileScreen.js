import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SuccessModal from '../components/SuccessModal';
import AppLoader from '../components/AppLoader';
import { s } from './edit-profile/styles';
import { formatDisplayDate } from './edit-profile/utils';
import useProfileForm from './edit-profile/hooks/useProfileForm';
import useReferenceLists from './edit-profile/hooks/useReferenceLists';
import ScreenHeader from './edit-profile/components/ScreenHeader';
import FormSection from './edit-profile/components/FormSection';
import TextField from './edit-profile/components/TextField';
import SelectField from './edit-profile/components/SelectField';
import GenderToggle from './edit-profile/components/GenderToggle';
import LocationField from './edit-profile/components/LocationField';
import OptionSheet from './edit-profile/components/OptionSheet';
import BirthDateSheet from './edit-profile/components/BirthDateSheet';
import LockedIdentity from './edit-profile/components/LockedIdentity';
import useBottomInset from '../hooks/useBottomInset';

// Profilni tahrirlash: shaxsiy ma'lumot, aloqa va manzil. Forma holati `useProfileForm` da,
// tanlov ro'yxatlari `useReferenceLists` da, har bir maydon/oyna `edit-profile/components/` da.
export default function EditProfileScreen({ onBack }) {
  const bottomInset = useBottomInset();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();

  const form = useProfileForm();
  const { values: v, setField } = form;
  const lists = useReferenceLists(v.regionId);

  // Qaysi tanlov oynasi ochiq: 'region' | 'district' | 'date' | null.
  const [sheet, setSheet] = useState(null);
  const closeSheet = () => setSheet(null);

  const selectedRegion = lists.regions.find((r) => r.id === v.regionId);
  const selectedDistrict = lists.districts.find((d) => d.id === v.districtId);

  if (form.initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={t.isDark ? 'light' : 'dark'} />
        <ScreenHeader onBack={onBack} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppLoader size={120} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScreenHeader onBack={onBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: 40 + bottomInset }]}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection title={tr('editProfile.groups.personal')}>
            {v.namesLocked ? (
              <LockedIdentity
                firstName={v.firstName}
                lastName={v.lastName}
                middleName={v.middleName}
                birthDate={v.birthDate}
              />
            ) : (
              <>
                <TextField
                  label={tr('editProfile.firstNameLabel')}
                  value={v.firstName}
                  onChangeText={(x) => setField('firstName', x)}
                  placeholder={tr('editProfile.firstNamePlaceholder')}
                />
                <TextField
                  label={tr('editProfile.lastNameLabel')}
                  value={v.lastName}
                  onChangeText={(x) => setField('lastName', x)}
                  placeholder={tr('editProfile.lastNamePlaceholder')}
                />
              </>
            )}
            <GenderToggle
              genders={lists.genders}
              selectedId={v.genderId}
              onSelect={(id) => setField('genderId', id)}
              loading={lists.gendersLoading}
            />
            {v.namesLocked ? null : (
              <SelectField
                label={tr('editProfile.birthDateLabel')}
                value={formatDisplayDate(v.birthDate)}
                placeholder={tr('editProfile.birthDatePlaceholder')}
                onPress={() => setSheet('date')}
              />
            )}
          </FormSection>

          <FormSection title={tr('editProfile.groups.contact')}>
            <TextField
              label={tr('editProfile.emailLabel')}
              value={v.email}
              onChangeText={(x) => setField('email', x)}
              placeholder={tr('editProfile.emailPlaceholder')}
              keyboardType="email-address"
            />
          </FormSection>

          <FormSection title={tr('editProfile.groups.address')}>
            <SelectField
              label={tr('editProfile.regionLabel')}
              value={selectedRegion?.name}
              placeholder={tr('editProfile.regionPlaceholder')}
              onPress={() => setSheet('region')}
            />
            <SelectField
              label={tr('editProfile.districtLabel')}
              value={selectedDistrict?.name}
              placeholder={
                v.regionId
                  ? tr('editProfile.districtPlaceholder')
                  : tr('editProfile.districtPlaceholderNoRegion')
              }
              onPress={() => setSheet('district')}
              disabled={!v.regionId}
            />
            <TextField
              label={tr('editProfile.addressLabel')}
              value={v.address}
              onChangeText={(x) => setField('address', x)}
              placeholder={tr('editProfile.addressPlaceholder')}
            />
            <LocationField
              lat={v.gpsLat}
              lng={v.gpsLng}
              onChange={(lat, lng) => {
                setField('gpsLat', lat);
                setField('gpsLng', lng);
              }}
            />
            <TextField
              label={tr('editProfile.landmarkLabel')}
              value={v.landmark}
              onChangeText={(x) => setField('landmark', x)}
              placeholder={tr('editProfile.landmarkPlaceholder')}
            />
          </FormSection>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: form.isReady ? t.orange : t.orange + '55' }]}
            activeOpacity={0.85}
            onPress={form.save}
            disabled={!form.isReady}
          >
            {form.saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>{tr('editProfile.saveBtn')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={sheet === 'region'}
        onClose={closeSheet}
        title={tr('editProfile.pickRegionTitle')}
        options={lists.regions}
        selectedId={v.regionId}
        onSelect={(item) => setField('regionId', item.id)}
        loading={lists.regionsLoading}
      />
      <OptionSheet
        visible={sheet === 'district'}
        onClose={closeSheet}
        title={tr('editProfile.pickDistrictTitle')}
        options={lists.districts}
        selectedId={v.districtId}
        onSelect={(item) => setField('districtId', item.id)}
        loading={lists.districtsLoading}
      />
      <BirthDateSheet
        visible={sheet === 'date'}
        onClose={closeSheet}
        value={v.birthDate}
        onChange={(x) => setField('birthDate', x)}
      />
      <SuccessModal
        visible={form.saved}
        onClose={() => {
          form.dismissSaved();
          onBack();
        }}
        t={t}
        message={tr('editProfile.successMessage')}
      />
    </SafeAreaView>
  );
}
