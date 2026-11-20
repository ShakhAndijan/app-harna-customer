import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { askCamera } from '../utils/permissions';
import useBottomInset from '../hooks/useBottomInset';

const FIELD_OPTIONS = [
  { key: 'plumbing', name: 'Santexnika', icon: 'wrench', color: '#2fa37a' },
  { key: 'electrical', name: 'Elektr montaji', icon: 'lightning-bolt', color: '#e87a45' },
  { key: 'design', name: 'Dizayn', icon: 'palette-outline', color: '#9b6cd1' },
  { key: 'hvac', name: 'Konditsioner', icon: 'air-conditioner', color: '#3f7fd4' },
  { key: 'carpentry', name: 'Duradgorlik', icon: 'hammer', color: '#8d6e63' },
  { key: 'other', name: 'Boshqa', icon: 'certificate-outline', color: '#6c7f9a' },
];

const pad2 = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const formatDate = (d) => (d ? `${pad2(d.day)}.${pad2(d.month)}.${d.year}` : '');

/* ── Minimal iOS-style photo source sheet (same language as AvatarPickerSheet) ── */
function PhotoSourceSheet({ visible, onClose, onPickCamera, onPickGallery, t }) {
  const { t: tr } = useLanguage();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.sheetOverlay} />
      </TouchableWithoutFeedback>

      <View style={s.sheetWrap}>
        <View style={s.grabberRow}>
          <View style={[s.grabber, { backgroundColor: '#ffffff55' }]} />
        </View>

        <View style={[s.sheetGroup, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[s.sheetGroupTitle, { color: t.muted }]}>
            {tr('addCertificate.photoSheetTitle')}
          </Text>
          <View style={[s.sheetDivider, { backgroundColor: t.border }]} />
          <TouchableOpacity style={s.sheetRow} activeOpacity={0.6} onPress={onPickCamera}>
            <Feather name="camera" size={18} color={t.text} style={{ marginRight: 9 }} />
            <Text style={[s.sheetRowText, { color: t.text }]}>{tr('avatarPicker.camera')}</Text>
          </TouchableOpacity>
          <View style={[s.sheetDivider, { backgroundColor: t.border }]} />
          <TouchableOpacity style={s.sheetRow} activeOpacity={0.6} onPress={onPickGallery}>
            <Feather name="image" size={18} color={t.text} style={{ marginRight: 9 }} />
            <Text style={[s.sheetRowText, { color: t.text }]}>{tr('avatarPicker.gallery')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.sheetCancel, { backgroundColor: t.card, borderColor: t.border }]}
          activeOpacity={0.6}
          onPress={onClose}
        >
          <Text style={[s.sheetCancelText, { color: t.text }]}>{tr('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/* ── Date wheel column, shared by both date pickers below ── */
function DateColumn({ values, value, onChange, format, t }) {
  const idx = Math.max(0, values.indexOf(value));
  return (
    <FlatList
      data={values}
      keyExtractor={(v) => String(v)}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      initialScrollIndex={idx}
      getItemLayout={(_, i) => ({ length: 40, offset: 40 * i, index: i })}
      renderItem={({ item }) => {
        const selected = item === value;
        return (
          <TouchableOpacity style={s.dateCell} onPress={() => onChange(item)} activeOpacity={0.7}>
            <Text
              style={[
                s.dateCellText,
                { color: selected ? t.orange : t.muted, fontWeight: selected ? '700' : '400' },
              ]}
            >
              {format ? format(item) : item}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

/* ── Date picker sheet — used for both "Olingan sana" and "Amal qilish muddati" ── */
function DatePickerSheet({ visible, onClose, title, value, onConfirm, onClear, t }) {
  const { t: tr } = useLanguage();
  const monthNames = tr('login.registerStep.birthDate.months');
  const currentYear = new Date().getFullYear();
  const [day, setDay] = useState(value?.day ?? 1);
  const [month, setMonth] = useState(value?.month ?? 1);
  const [year, setYear] = useState(value?.year ?? currentYear);

  useEffect(() => {
    if (visible) {
      setDay(value?.day ?? 1);
      setMonth(value?.month ?? 1);
      setYear(value?.year ?? currentYear);
    }
  }, [visible]);

  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: currentYear + 15 - 1980 + 1 }, (_, i) => 1980 + i);

  const changeMonth = (m) => {
    setMonth(m);
    if (day > daysInMonth(year, m)) setDay(daysInMonth(year, m));
  };
  const changeYear = (y) => {
    setYear(y);
    if (day > daysInMonth(y, month)) setDay(daysInMonth(y, month));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.sheetOverlay} />
      </TouchableWithoutFeedback>

      <View style={[s.dateSheet, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={s.grabberRow}>
          <View style={[s.grabber, { backgroundColor: t.border }]} />
        </View>
        <View style={s.dateSheetHeader}>
          <Text style={[s.dateSheetTitle, { color: t.text }]}>{title}</Text>
          <TouchableOpacity
            style={[s.sheetCloseBtn, { backgroundColor: t.rowIconBg }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={16} color={t.muted} />
          </TouchableOpacity>
        </View>

        <View style={s.dateWheelWrap}>
          <View style={[s.dateHighlight, { backgroundColor: t.rowIconBg }]} pointerEvents="none" />
          <DateColumn values={days} value={day} onChange={setDay} t={t} />
          <DateColumn
            values={months}
            value={month}
            onChange={changeMonth}
            format={(m) => monthNames[m - 1]}
            t={t}
          />
          <DateColumn values={years} value={year} onChange={changeYear} t={t} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 6, gap: 8 }}>
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: t.orange }]}
            activeOpacity={0.85}
            onPress={() => onConfirm({ day, month, year })}
          >
            <Text style={s.confirmBtnText}>{tr('common.confirm')}</Text>
          </TouchableOpacity>
          {onClear && (
            <TouchableOpacity style={s.clearBtn} activeOpacity={0.7} onPress={onClear}>
              <Text style={[s.clearBtnText, { color: t.muted }]}>
                {tr('addCertificate.leaveIndefinite')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function TextField({ label, value, onChangeText, placeholder, t, keyboardType, optional }) {
  const { t: tr } = useLanguage();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.fieldLabel, { color: t.muted }]}>
        {label}
        {optional ? <Text style={{ color: t.faint }}> {tr('addCertificate.optional')}</Text> : null}
      </Text>
      <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
        <TextInput
          style={[s.input, { color: t.text }]}
          placeholder={placeholder}
          placeholderTextColor={t.faint}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
        />
      </View>
    </View>
  );
}

function DateField({ label, value, placeholder, onPress, onClear, t, optional }) {
  const { t: tr } = useLanguage();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.fieldLabel, { color: t.muted }]}>
        {label}
        {optional ? <Text style={{ color: t.faint }}> {tr('addCertificate.optional')}</Text> : null}
      </Text>
      <TouchableOpacity
        style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather name="calendar" size={16} color={t.faint} style={{ marginRight: 10 }} />
        <Text style={[s.input, { color: value ? t.text : t.faint }]}>{value || placeholder}</Text>
        {value && onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={17} color={t.faint} />
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={18} color={t.faint} />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AddCertificateScreen({ onBack, onSave }) {
  const bottomInset = useBottomInset();
  const { theme: t } = useTheme();
  const { t: tr } = useLanguage();
  const monthNames = tr('login.registerStep.birthDate.months');
  const [photoUri, setPhotoUri] = useState(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const [selectedField, setSelectedField] = useState(null);
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [obtainedDate, setObtainedDate] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [certNumber, setCertNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const [showObtainedSheet, setShowObtainedSheet] = useState(false);
  const [showExpirySheet, setShowExpirySheet] = useState(false);

  const openPhotoSheet = () => setShowPhotoSheet(true);

  const pickFromGallery = async () => {
    setShowPhotoSheet(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      appAlert(tr('avatarPicker.permissionTitle'), tr('addCertificate.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    setShowPhotoSheet(false);
    // Tizim so'rovidan oldin sabab aytiladi; "Keyinroq" (null) — jim qaytamiz.
    const granted = await askCamera(tr, 'certificate', { again: true });
    if (granted === null) return;
    if (!granted) {
      appAlert(tr('avatarPicker.permissionTitle'), tr('addCertificate.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const isReady =
    !!photoUri &&
    title.trim().length > 0 &&
    !!selectedField &&
    institution.trim().length > 0 &&
    !!obtainedDate &&
    !saving;

  const handleSave = () => {
    if (!isReady) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave?.({
        id: `c${Date.now()}`,
        title: title.trim(),
        field: selectedField.name,
        institution: institution.trim(),
        day: obtainedDate.day,
        month: monthNames[obtainedDate.month - 1],
        year: obtainedDate.year,
        expiryDate: expiryDate
          ? { day: expiryDate.day, month: monthNames[expiryDate.month - 1], year: expiryDate.year }
          : null,
        certNumber: certNumber.trim() || '—',
        status: 'pending',
        color: selectedField.color,
        icon: selectedField.icon,
        image: photoUri,
      });
    }, 700);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <View style={[s.header, { backgroundColor: t.bg }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>{tr('addCertificate.headerTitle')}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: 40 + bottomInset }]}
          keyboardShouldPersistTaps="handled"
        >
          {photoUri ? (
            <TouchableOpacity style={s.photoWrap} activeOpacity={0.9} onPress={openPhotoSheet}>
              <Image source={{ uri: photoUri }} style={s.photoImg} resizeMode="cover" />
              <View style={[s.photoChangeBtn, { backgroundColor: 'rgba(10,19,34,0.72)' }]}>
                <Feather name="repeat" size={12} color="#fff" />
                <Text style={s.photoChangeText}>{tr('addCertificate.changePhoto')}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.photoPlaceholder, { backgroundColor: t.inputBg, borderColor: t.border }]}
              activeOpacity={0.8}
              onPress={openPhotoSheet}
            >
              <View style={[s.photoPlaceholderIcon, { backgroundColor: t.orange + '18' }]}>
                <MaterialCommunityIcons name="certificate-outline" size={26} color={t.orange} />
              </View>
              <Text style={[s.photoPlaceholderTitle, { color: t.text }]}>
                {tr('addCertificate.photoSheetTitle')}
              </Text>
              <Text style={[s.photoPlaceholderSub, { color: t.muted }]}>
                {tr('addCertificate.photoPlaceholderSub')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ marginTop: 20, gap: 8 }}>
            <Text style={[s.fieldLabel, { color: t.muted }]}>
              {tr('addCertificate.fieldLabel')}
            </Text>
            <View style={s.chipsRow}>
              {FIELD_OPTIONS.map((opt) => {
                const on = selectedField?.name === opt.name;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setSelectedField(opt)}
                    activeOpacity={0.8}
                    style={[
                      s.chip,
                      {
                        backgroundColor: on ? opt.color : t.inputBg,
                        borderColor: on ? opt.color : t.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={14}
                      color={on ? '#fff' : opt.color}
                    />
                    <Text style={[s.chipText, { color: on ? '#fff' : t.text }]}>
                      {tr(`addCertificate.fields.${opt.key}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 18, gap: 16 }}>
            <TextField
              label={tr('addCertificate.titleLabel')}
              value={title}
              onChangeText={setTitle}
              placeholder={tr('addCertificate.titlePlaceholder')}
              t={t}
            />
            <TextField
              label={tr('certificates.institutionLabel')}
              value={institution}
              onChangeText={setInstitution}
              placeholder={tr('addCertificate.institutionPlaceholder')}
              t={t}
            />

            <DateField
              label={tr('certificates.issuedLabel')}
              value={formatDate(obtainedDate)}
              placeholder={tr('addCertificate.pickDate')}
              onPress={() => setShowObtainedSheet(true)}
              t={t}
            />

            <DateField
              label={tr('certificates.expiryLabel')}
              value={formatDate(expiryDate)}
              placeholder={tr('certificates.noExpiry')}
              onPress={() => setShowExpirySheet(true)}
              onClear={expiryDate ? () => setExpiryDate(null) : null}
              t={t}
              optional
            />

            <TextField
              label={tr('certificates.certNumberLabel')}
              value={certNumber}
              onChangeText={setCertNumber}
              placeholder={tr('addCertificate.certNumberPlaceholder')}
              t={t}
              optional
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: isReady ? t.orange : t.orange + '55' }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={!isReady}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>{tr('editProfile.saveBtn')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoSourceSheet
        visible={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        onPickCamera={pickFromCamera}
        onPickGallery={pickFromGallery}
        t={t}
      />

      <DatePickerSheet
        visible={showObtainedSheet}
        onClose={() => setShowObtainedSheet(false)}
        title={tr('certificates.issuedLabel')}
        value={obtainedDate}
        onConfirm={(d) => {
          setObtainedDate(d);
          setShowObtainedSheet(false);
        }}
        t={t}
      />

      <DatePickerSheet
        visible={showExpirySheet}
        onClose={() => setShowExpirySheet(false)}
        title={tr('certificates.expiryLabel')}
        value={expiryDate}
        onConfirm={(d) => {
          setExpiryDate(d);
          setShowExpirySheet(false);
        }}
        onClear={() => {
          setExpiryDate(null);
          setShowExpirySheet(false);
        }}
        t={t}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontWeight: '700', fontSize: 19 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  photoWrap: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoChangeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  photoChangeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  photoPlaceholder: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 6,
  },
  photoPlaceholderIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  photoPlaceholderTitle: { fontSize: 14.5, fontWeight: '700' },
  photoPlaceholderSub: { fontSize: 12, fontWeight: '500' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: '700' },

  fieldLabel: { fontSize: 13, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14.5, fontWeight: '500', padding: 0 },

  saveBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,8,14,0.55)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 20,
  },
  grabberRow: { alignItems: 'center', paddingBottom: 10 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  sheetGroup: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetGroupTitle: {
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sheetDivider: { height: 1 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  sheetRowText: { fontSize: 16, fontWeight: '500' },
  sheetCancel: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetCancelText: { fontSize: 16, fontWeight: '700' },

  dateSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 24,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  dateSheetTitle: { fontSize: 17, fontWeight: '700' },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateWheelWrap: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 20,
    position: 'relative',
  },
  dateHighlight: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 80,
    height: 40,
    borderRadius: 10,
  },
  dateCell: { height: 40, alignItems: 'center', justifyContent: 'center' },
  dateCellText: { fontSize: 15 },

  confirmBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearBtn: { alignItems: 'center', paddingVertical: 6 },
  clearBtnText: { fontSize: 13, fontWeight: '600' },
});
