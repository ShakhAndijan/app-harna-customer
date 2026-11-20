import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import PresenceBadge from '../../../components/PresenceBadge';
import AppLoader from '../../../components/AppLoader';
import { useLanguage } from '../../../context/LanguageContext';
import { useUstaStyles } from '../styles';
import UstaAvatar from './UstaAvatar';
import { formatDuration } from '../utils';

// `onPress` berilsa katak bosiladi (ochiq "yoqtirish"); `active` — shu mijoz allaqachon bosgan.
function Stat({ value, label, onPress, active, a11yLabel }) {
  const { C } = useUstaStyles();
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {onPress ? (
          <Ionicons
            name={active ? 'thumbs-up' : 'thumbs-up-outline'}
            size={15}
            color={active ? C.orange : C.dim}
          />
        ) : null}
        <Text style={{ color: active ? C.orange : C.txt, fontWeight: '800', fontSize: 17 }}>
          {value}
        </Text>
      </View>
      <Text
        style={{ color: active ? C.orange : C.dim, fontSize: 11, textAlign: 'center' }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </>
  );
  if (!onPress) return <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>{body}</View>;
  return (
    <TouchableOpacity
      style={{ flex: 1, alignItems: 'center', gap: 2 }}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={a11yLabel}
    >
      {body}
    </TouchableOpacity>
  );
}

function Pill({ label, color }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: `${color}26`,
      }}
    >
      <Text style={{ color, fontSize: 11.5, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

// Profil boshi (Instagram uslubida): chapda surat, o'ngda ism va 3 ta ko'rsatkich; pastda nishonlar, kasb, hudud (bio "Ma'lumot" tabida).
export default function ProfileTop({
  initial,
  name,
  trade,
  location,
  rating,
  reviewCount,
  completedJobs,
  likes,
  likedByMe,
  onToggleThumb,
  onTimePercent,
  bgColor,
  photo,
  presence,
  isIdentityVerified,
  isPro,
  isTop,
  avgResponseMin,
  showLoader,
}) {
  const { t: tr } = useLanguage();
  const { C } = useUstaStyles();

  return (
    <View style={{ gap: 12, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <UstaAvatar initial={initial} size={84} bgColor={bgColor} uri={photo} />
        <View style={{ flex: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{ flexShrink: 1, color: C.txt, fontSize: 18, fontWeight: '800' }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isIdentityVerified ? (
              <Ionicons name="shield-checkmark" size={18} color={C.green} />
            ) : null}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={`★ ${rating}`} label={`${tr('ustaDetail.ig.rating')} (${reviewCount})`} />
            <Stat value={completedJobs} label={tr('ustaDetail.ig.jobs')} />
            <Stat
              value={likes}
              label={tr('ustaDetail.ig.likes')}
              onPress={onToggleThumb}
              active={likedByMe}
              a11yLabel={tr('workerStats.like')}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {isPro ? <Pill label="PRO" color={C.purple} /> : null}
          {isTop ? <Pill label="TOP" color={C.gold} /> : null}
          <PresenceBadge worker={presence} />
          {onTimePercent != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={C.dim} />
              <Text style={{ color: C.dim, fontSize: 12 }}>
                {tr('workerStats.onTime', { n: onTimePercent })}
              </Text>
            </View>
          ) : null}
          {avgResponseMin != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flash-outline" size={13} color={C.dim} />
              <Text style={{ color: C.dim, fontSize: 12 }}>
                {tr('ustaDetail.avgResponse', { time: formatDuration(tr, avgResponseMin) }).replace(
                  /^·\s*/,
                  ''
                )}
              </Text>
            </View>
          ) : null}
        </View>
        {!!trade && (
          <Text style={{ color: C.txt, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
            {trade}
          </Text>
        )}
        {!!location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={15} color={C.orange} />
            <Text style={{ flex: 1, color: C.dim, fontSize: 13 }} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
        {showLoader && <AppLoader size={56} style={{ alignItems: 'center', marginTop: 6 }} />}
      </View>
    </View>
  );
}
