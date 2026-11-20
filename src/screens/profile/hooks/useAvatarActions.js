import { useState } from 'react';
import { appAlert } from '../../../components/AppAlert';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../../context/LanguageContext';
import { useUser } from '../../../context/UserContext';
import { getAvatarUploadUrl, confirmAvatar, deleteAvatar } from '../../../api/user';
import { uploadImageToPresignedUrl } from '../../../api/auth';
import { getErrorMessage } from '../../../utils/errors';
import { askCamera } from '../../../utils/permissions';

// Galereya yoki kameradan kvadrat rasm tanlaydi; tanlansa onPicked(uri, mimeType) chaqiriladi.
async function pickImage(source, onPicked, tr) {
  const fromCamera = source === 'camera';
  // Kamerada tizim so'rovidan oldin sabab aytiladi; "Keyinroq" (null) — jim qaytamiz.
  const granted = fromCamera
    ? await askCamera(tr, 'avatar', { again: true })
    : (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;
  if (granted === null) return;
  if (!granted) {
    appAlert(
      tr('profile.errors.permissionTitle'),
      tr(fromCamera ? 'profile.errors.cameraPermission' : 'profile.errors.galleryPermission')
    );
    return;
  }
  const options = { quality: 0.8, allowsEditing: true, aspect: [1, 1] };
  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync({ ...options, mediaTypes: ['images'] });
  if (!result.canceled) {
    const asset = result.assets[0];
    onPicked(asset.uri, asset.mimeType || 'image/jpeg');
  }
}

// Profil rasmi: tanlash oynasi, kamera/galereya, yuklash (presigned URL → tasdiqlash) va o'chirish.
// Yuklanayotganda tanlangan rasm darrov ko'rinadi (`previewUri`), xato bo'lsa qaytariladi.
export default function useAvatarActions() {
  const { t: tr } = useLanguage();
  const { refreshUser } = useUser();
  const [previewUri, setPreviewUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const commit = async (uri, contentType = 'image/jpeg') => {
    setPreviewUri(uri);
    setUploading(true);
    try {
      const { upload_url, temp_key } = await getAvatarUploadUrl(contentType);
      await uploadImageToPresignedUrl(upload_url, uri, contentType);
      await confirmAvatar(temp_key);
      await refreshUser();
      setPreviewUri(null);
    } catch (e) {
      setPreviewUri(null);
      appAlert(
        tr('common.errorTitle'),
        getErrorMessage(e, tr, 'profile.errors.avatarUploadFailed')
      );
    } finally {
      setUploading(false);
    }
  };

  const pickCamera = () => {
    setSheetOpen(false);
    pickImage('camera', commit, tr);
  };

  const pickGallery = () => {
    setSheetOpen(false);
    pickImage('gallery', commit, tr);
  };

  const remove = async () => {
    setSheetOpen(false);
    setPreviewUri(null);
    setUploading(true);
    try {
      await deleteAvatar();
      await refreshUser();
    } catch (e) {
      appAlert(
        tr('common.errorTitle'),
        getErrorMessage(e, tr, 'profile.errors.avatarDeleteFailed')
      );
    } finally {
      setUploading(false);
    }
  };

  return {
    previewUri,
    uploading,
    sheetOpen,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    pickCamera,
    pickGallery,
    remove,
  };
}
