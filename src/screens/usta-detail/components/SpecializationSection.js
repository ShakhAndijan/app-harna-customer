import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useUstaStyles } from '../styles';
import SectionTitle from './SectionTitle';
import OptionSheet from '../../new-order/components/OptionSheet';

// Mutaxassislik yo'nalishlari: bitta tanlov maydoni, bosilsa ro'yxat ochiladi (yo'nalish ko'p bo'lsa joy egallamasin).
// Tanlangan yo'nalish narxlar va sertifikatlarni filtrlaydi.
export default function SpecializationSection({ categories, selectedId, onSelect, loading }) {
  const { t: tr } = useLanguage();
  const { theme } = useTheme();
  const { C, st } = useUstaStyles();
  const [open, setOpen] = useState(false);

  const selected = categories.find((c) => c.id === selectedId) ?? categories[0] ?? null;
  const canPick = categories.length > 1;

  return (
    <>
      <SectionTitle icon="briefcase-outline" title={tr('ustaDetail.specializationTitle')} />
      {selected ? (
        <>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={!canPick}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={selected.name}
            style={[
              st.card,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                height: 50,
              },
            ]}
          >
            <Text
              style={{ flex: 1, fontSize: 14, fontWeight: '700', color: C.txt }}
              numberOfLines={1}
            >
              {selected.name}
            </Text>
            {canPick ? (
              <>
                <View
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: 12,
                    paddingHorizontal: 7,
                    backgroundColor: 'rgba(232,123,62,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: C.orange, fontSize: 12.5, fontWeight: '800' }}>
                    {categories.length}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={C.dim2} />
              </>
            ) : null}
          </TouchableOpacity>

          {canPick ? (
            <OptionSheet
              visible={open}
              onClose={() => setOpen(false)}
              title={tr('ustaDetail.specializationTitle')}
              options={categories}
              selectedId={selected.id}
              onSelect={onSelect}
              t={theme}
              tr={tr}
            />
          ) : null}
        </>
      ) : (
        <View style={[st.card, { padding: 16, alignItems: 'center' }]}>
          <Text style={{ fontSize: 12.5, color: C.dim }}>
            {loading ? tr('common.loading') : tr('ustaDetail.specializationEmpty')}
          </Text>
        </View>
      )}
    </>
  );
}
