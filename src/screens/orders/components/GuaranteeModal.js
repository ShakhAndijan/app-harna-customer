import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { appAlert } from '../../../components/AppAlert';
import FlowModal from '../../requests/components/FlowModal';

const MAX_TEXT = 1000;
const MAX_PHOTOS = 10;

// Kafolat murojaati: nima noto'g'ri bajarilgani (1–1000 belgi, majburiy) va rasmlar (ixtiyoriy).
// `onSubmit(description, photos)` — rasmlar [{ uri, mimeType }].
export default function GuaranteeModal({ visible, ...rest }) {
  // Forma har ochilganda yangidan boshlanadi.
  return visible ? <Form {...rest} /> : null;
}

function Form({ busy, onClose, onSubmit }) {
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      appAlert(tr('common.errorTitle'), tr('newOrder.photosPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((prev) =>
      [...prev, ...result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType }))].slice(
        0,
        MAX_PHOTOS
      )
    );
  };

  const description = text.trim();

  return (
    <FlowModal
      visible
      title={tr('guarantee.title')}
      hint={tr('guarantee.formHint')}
      confirmLabel={tr('guarantee.send')}
      disabled={description.length === 0}
      busy={busy}
      onClose={onClose}
      onSubmit={() => onSubmit(description, photos)}
    >
      <Text style={[s.label, { color: t.text }]}>{tr('guarantee.whatWrong')}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        maxLength={MAX_TEXT}
        placeholder={tr('guarantee.descriptionHint')}
        placeholderTextColor={t.faint}
        style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
      />

      <View style={s.photos}>
        {photos.map((p) => (
          <View key={p.uri} style={s.tile}>
            <Image source={{ uri: p.uri }} style={s.tileImg} />
            <TouchableOpacity
              onPress={() => setPhotos((prev) => prev.filter((x) => x.uri !== p.uri))}
              disabled={busy}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={s.remove}
            >
              <MaterialCommunityIcons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            onPress={pickPhotos}
            disabled={busy}
            activeOpacity={0.8}
            style={[s.add, { backgroundColor: t.card, borderColor: t.border }]}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={22} color={t.orange} />
            <Text style={[s.addTxt, { color: t.muted }]}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </FlowModal>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13.5, fontWeight: '700' },
  input: {
    minHeight: 110,
    maxHeight: 180,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden' },
  tileImg: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addTxt: { fontSize: 10.5, fontWeight: '600' },
});
