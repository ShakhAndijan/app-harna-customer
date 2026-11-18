// Buyurtma rasmlari: tanlash, o'chirish va backendga yuklash.

import { useState, useRef } from 'react';
import { appAlert } from '../../../components/AppAlert';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../../context/LanguageContext';
import { uploadOrderPhoto } from '../../../api/orders';
import { MAX_PHOTOS } from '../constants';

export default function useOrderPhotos() {
  const { t: tr } = useLanguage();
  const [photos, setPhotos] = useState([]);
  // "Yana chaqirish": eski buyurtmadan saqlab qolingan rasmlar (URL). Qayta yuklanmaydi; yangilar bilan jami MAX_PHOTOS.
  const [keptPhotos, setKeptPhotos] = useState([]);
  // uri → picker mimeType va uri → yuklangan temp_key. Yuborish xato bilan
  // tugab qayta urinilganda allaqachon yuklangan rasmlar qayta yuklanmaydi.
  const photoMimeRef = useRef({});
  const photoKeysRef = useRef({});

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length - keptPhotos.length;
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
    if (!result.canceled) {
      result.assets.forEach((a) => {
        photoMimeRef.current[a.uri] = a.mimeType;
      });
      setPhotos((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS - keptPhotos.length)
      );
    }
  };

  const removePhoto = (uri) => {
    delete photoMimeRef.current[uri];
    delete photoKeysRef.current[uri];
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const removeKept = (url) => setKeptPhotos((prev) => prev.filter((p) => p !== url));

  // Hali yuklanmagan rasmlarni yuklaydi va barcha rasmlarning temp_key'larini
  // (tanlangan tartibda) qaytaradi. Xato bo'lsa chaqiruvchiga uzatadi.
  const uploadAll = async () => {
    await Promise.all(
      photos
        .filter((uri) => !photoKeysRef.current[uri])
        .map(async (uri) => {
          photoKeysRef.current[uri] = await uploadOrderPhoto(uri, photoMimeRef.current[uri]);
        })
    );
    return photos.map((uri) => photoKeysRef.current[uri]);
  };

  return { photos, pickPhotos, removePhoto, uploadAll, keptPhotos, setKeptPhotos, removeKept };
}
