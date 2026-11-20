import { View, Text, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../../../constants/colors';
import { useLanguage } from '../../../context/LanguageContext';

// Sahifa oxiridagi "Kirish" chaqirig'i.
export default function ClosingCta({ onPress, onOrder, onHelp }) {
  const { t } = useLanguage();

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: COLORS.card,
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 220,
          height: 180,
          backgroundColor: 'rgba(232,122,69,0.10)',
          borderRadius: 110,
        }}
      />
      <Text
        style={{
          color: COLORS.white,
          fontWeight: '800',
          fontSize: 20,
          marginBottom: 8,
          textAlign: 'center',
          lineHeight: 27,
        }}
      >
        {t('app.closingCta.title')}
      </Text>
      <Text
        style={{
          color: COLORS.gray,
          fontSize: 13.5,
          textAlign: 'center',
          marginBottom: 20,
          lineHeight: 20,
        }}
      >
        {t('app.closingCta.sub')}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.orange,
          borderRadius: 14,
          paddingVertical: 14,
          gap: 8,
          width: '100%',
        }}
      >
        <Feather name="log-in" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          {t('app.closingCta.button')}
        </Text>
      </TouchableOpacity>
      {!!onOrder && (
        <TouchableOpacity
          onPress={onOrder}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: COLORS.orange,
            paddingVertical: 13,
            gap: 8,
            width: '100%',
            marginTop: 10,
          }}
        >
          <Feather name="edit-3" size={18} color={COLORS.orange} />
          <Text style={{ color: COLORS.orange, fontWeight: '700', fontSize: 15 }}>
            {t('app.closingCta.order')}
          </Text>
        </TouchableOpacity>
      )}
      {!!onHelp && (
        <TouchableOpacity onPress={onHelp} activeOpacity={0.7} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.gray, fontWeight: '700', fontSize: 13.5 }}>
            {t('guestSupport.helpLink')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
