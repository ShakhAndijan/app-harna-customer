import { useState, useRef, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUstaStyles } from '../styles';
import { CARD_GAP, CARD_SLOT } from '../constants';
import { encodeImageUri, formatDate } from '../utils';
import useThumb from '../../../hooks/useThumb';

// Karta rasmi: 800 px nusxa, u bo'lmasa rasmning o'zi.
function WorkImage({ uri }) {
  const { src, onError } = useThumb(uri);
  return (
    <Image
      source={{ uri: encodeImageUri(src) }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
      onError={onError}
    />
  );
}

// Ustaning bajargan ishlari: o'zi aylanib turuvchi gorizontal karusel (2.2 soniyada bitta).
export default function WorksCarousel({ works, onSelectWork }) {
  const { C, st } = useUstaStyles();
  const listRef = useRef(null);
  const idxRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (works.length === 0) return;
    const timer = setInterval(() => {
      const next = (idxRef.current + 1) % works.length;
      idxRef.current = next;
      setActive(next);
      listRef.current?.scrollToOffset({ offset: next * CARD_SLOT, animated: true });
    }, 2200);
    return () => clearInterval(timer);
  }, [works.length]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={works}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_SLOT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 10, gap: CARD_GAP }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={st.workCard}
            activeOpacity={0.85}
            onPress={() => onSelectWork?.(item)}
          >
            <View style={[st.workImg, !item.photo && { backgroundColor: C.card3 }]}>
              {item.photo ? (
                <WorkImage uri={item.photo} />
              ) : (
                <MaterialCommunityIcons name="image-outline" size={36} color={C.dim2} />
              )}
              {item.rating != null && (
                <View style={st.workBadge}>
                  <Ionicons name="star" size={11} color={C.gold} />
                  <Text style={st.workBadgeTxt}>{Number(item.rating).toFixed(1)}</Text>
                </View>
              )}
            </View>
            <View style={{ padding: 10 }}>
              <Text style={st.workTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {!!item.workDate && <Text style={st.workDate}>{formatDate(item.workDate)}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={st.dots}>
        {works.map((_, i) => (
          <View key={i} style={[st.dot, i === active && st.dotActive]} />
        ))}
      </View>
    </View>
  );
}
