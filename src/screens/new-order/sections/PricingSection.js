import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { common } from '../styles';
import MoneyInput from '../components/MoneyInput';
import PaymentOption from '../components/PaymentOption';
import PlatformPriceCard from '../components/PlatformPriceCard';

const TYPES = ['fixed', 'hourly'];
const ICON = { fixed: 'briefcase-check-outline', hourly: 'clock-time-four-outline' };

// To'lov shakli: tanlangan variant ("Ish uchun") ixcham kartada ko'rinadi, "O'zgartirish"
// bosilgandagina ikkala variant ("Ish uchun" / "Soatbay") ochiladi va tanlangach yana yig'iladi.
export default function PricingSection({
  pricingType,
  setPricingType,
  hourlyRate,
  setHourlyRate,
  estimatedHours,
  setEstimatedHours,
  fixedPrice,
  setFixedPrice,
  priceMissing,
  quote,
}) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [changing, setChanging] = useState(false);

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  const choose = (type) => {
    animate();
    setPricingType(type);
    setChanging(false);
  };

  const option = (type) => ({
    icon: ICON[type],
    iconBg: t.orange + '1f',
    iconColor: t.orange,
    title: tr(`newOrder.pricing.${type}`),
    subtitle: tr(`newOrder.pricing.${type}Hint`),
  });
  const current = option(pricingType);

  // Narxni platforma belgilagan ishlar: narx yozilmaydi, faqat o'qiladigan karta (soatbay ham yo'q).
  if (quote?.kind === 'priced') return <PlatformPriceCard quote={quote} />;

  return (
    <>
      {/* ── To'lov shakli ── */}
      <Text style={[common.label, { color: t.text }]}>
        {tr('newOrder.pricingLabel')}
        <Text style={{ color: t.red }}> *</Text>
      </Text>

      {changing ? (
        <View style={s.options}>
          {TYPES.map((type) => (
            <PaymentOption
              key={type}
              {...option(type)}
              active={pricingType === type}
              onPress={() => choose(type)}
              t={t}
            />
          ))}
        </View>
      ) : (
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.orange }]}>
          <View style={[s.icon, { backgroundColor: current.iconBg }]}>
            <MaterialCommunityIcons name={current.icon} size={21} color={t.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: t.text }]} numberOfLines={1}>
              {current.title}
            </Text>
            <Text style={[s.sub, { color: t.muted }]} numberOfLines={3}>
              {current.subtitle}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              animate();
              setChanging(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[s.change, { backgroundColor: t.orange + '1f' }]}
          >
            <Text style={[s.changeTxt, { color: t.orange }]}>{tr('newOrder.pricing.change')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.inputs}>
        {pricingType === 'hourly' ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MoneyInput
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder={tr('newOrder.pricing.ratePlaceholder')}
              suffix={tr('common.currencySom')}
              style={{ flex: 1 }}
              t={t}
            />
            <TextInput
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              keyboardType="number-pad"
              placeholder={tr('newOrder.pricing.hoursPlaceholder')}
              placeholderTextColor={t.faint}
              style={[
                common.input,
                { flex: 1, backgroundColor: t.card, borderColor: t.border, color: t.text },
              ]}
            />
          </View>
        ) : (
          <MoneyInput
            value={fixedPrice}
            onChangeText={setFixedPrice}
            placeholder={tr('newOrder.pricing.fixedPricePlaceholder')}
            suffix={tr('common.currencySom')}
            t={t}
          />
        )}
        {priceMissing && (
          <Text style={[s.required, { color: t.orange }]}>
            {tr(
              pricingType === 'hourly'
                ? 'newOrder.pricing.requiredHourly'
                : 'newOrder.pricing.requiredFixed'
            )}
          </Text>
        )}
        {/* Narxli va kelishiladigan ish aralash: server rad etadi (draft/qayta chaqirishdan kelishi mumkin). */}
        {quote?.kind === 'mixed' && (
          <Text style={[s.required, { color: t.red }]}>{tr('platformPrice.mixed')}</Text>
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  options: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  change: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  changeTxt: { fontSize: 12.5, fontWeight: '800' },
  inputs: { marginTop: 12 },
  required: { fontSize: 12, fontWeight: '600', marginTop: 8, lineHeight: 16 },
});
