import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { s } from '../styles';
import { formatDisplayDate } from '../utils';

function ReadOnlyField({ label, value }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={[s.fieldLabel, { color: t.muted }]}>{label}</Text>
      <Text selectable style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
        {value || '—'}
      </Text>
    </View>
  );
}

// MyID tasdiqlagan ism-familiya va tug'ilgan sana: oddiy matn (qutisiz), o'zgartirib bo'lmaydi —
// server o'zgarishni rad etadi, forma esa ularni saqlashda yubormaydi.
export default function LockedIdentity({ firstName, lastName, middleName, birthDate }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  return (
    <View style={{ gap: 12 }}>
      <ReadOnlyField label={tr('editProfile.firstNameLabel')} value={firstName} />
      <ReadOnlyField label={tr('editProfile.lastNameLabel')} value={lastName} />
      {middleName ? <ReadOnlyField label={tr('myid.middleName')} value={middleName} /> : null}
      <ReadOnlyField
        label={tr('editProfile.birthDateLabel')}
        value={formatDisplayDate(birthDate)}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <MaterialCommunityIcons name="lock-outline" size={15} color={t.muted} />
        <Text style={{ flex: 1, color: t.muted, fontSize: 13, lineHeight: 18 }}>
          {tr('myid.namesLocked')}
        </Text>
      </View>
    </View>
  );
}
