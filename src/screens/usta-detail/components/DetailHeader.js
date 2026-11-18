import { View, TouchableOpacity, Share } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { SITE_URL } from '../../../constants/config';
import { useLanguage } from '../../../context/LanguageContext';
import { useUstaStyles } from '../styles';

// Yuqori panel: orqaga, ulashish va (kirgan mijoz uchun) shikoyat va sevimliga qo'shish.
export default function DetailHeader({
  onBack,
  workerId,
  shareInfo,
  isLoggedIn,
  liked,
  onToggleLike,
  onReport,
}) {
  const { t: tr } = useLanguage();
  const { C, st } = useUstaStyles();

  // Havola saytdagi shu usta sahifasini ochadi (har kim bosa oladigan oddiy https havola).
  const share = () => {
    const text = tr('ustaDetail.shareMessage', shareInfo);
    const link = workerId ? `${SITE_URL}/mutaxassis/${workerId}` : '';
    Share.share({
      message: link
        ? `${text}
${link}`
        : text,
    }).catch(() => {});
  };

  return (
    <View style={st.header}>
      <TouchableOpacity onPress={onBack} style={st.iconBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={C.txt} />
      </TouchableOpacity>
      {/* Ism pastdagi profil boshida ko'rinadi, shuning uchun yuqorida sarlavha yo'q */}
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={st.iconBtn} activeOpacity={0.7} onPress={share}>
          <Feather name="share-2" size={18} color={C.txt} />
        </TouchableOpacity>
        {isLoggedIn && !!onReport && (
          <TouchableOpacity
            style={st.iconBtn}
            activeOpacity={0.7}
            onPress={onReport}
            accessibilityLabel={tr('complaints.report')}
          >
            <Ionicons name="flag-outline" size={19} color={C.txt} />
          </TouchableOpacity>
        )}
        {isLoggedIn && (
          <TouchableOpacity style={st.iconBtn} activeOpacity={0.7} onPress={onToggleLike}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? C.orange : C.txt}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
