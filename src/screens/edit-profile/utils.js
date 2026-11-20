// Sana va profil ma'lumotlari bilan ishlovchi yordamchilar.

export const pad2 = (n) => String(n).padStart(2, '0');

export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

// "2000-05-17" → { year, month, day }; noto'g'ri format bo'lsa null.
export const parseIsoDate = (str) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
  if (!m) return null;
  const [, yyyy, mm, dd] = m;
  return { year: Number(yyyy), month: Number(mm), day: Number(dd) };
};

// "2000-05-17" → "17.05.2000"
export const formatDisplayDate = (iso) => {
  const p = parseIsoDate(iso);
  if (!p) return '';
  return `${pad2(p.day)}.${pad2(p.month)}.${p.year}`;
};

// Backend jins/viloyat/tuman'ni obyekt ({id, name}) yoki oddiy id ko'rinishida qaytarishi mumkin.
const idOf = (v) => (v && typeof v === 'object' ? (v.id ?? null) : (v ?? null));

export const EMPTY_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  genderId: null,
  middleName: '',
  namesLocked: false,
  birthDate: '',
  regionId: null,
  districtId: null,
  address: '',
  gpsLat: null,
  gpsLng: null,
  landmark: '',
};

// GET /customers/me javobi → forma qiymatlari.
export function profileToForm(data) {
  return {
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    email: data.email || '',
    genderId: idOf(data.gender),
    middleName: data.middle_name || '',
    namesLocked: data.names_locked === true,
    birthDate: data.birth_date || '',
    regionId: idOf(data.region),
    districtId: idOf(data.district),
    address: data.address || '',
    gpsLat: data.default_gps_lat != null ? Number(data.default_gps_lat) : null,
    gpsLng: data.default_gps_lng != null ? Number(data.default_gps_lng) : null,
    landmark: data.default_landmark || '',
  };
}

// Forma qiymatlari → PATCH /customers/me tanasi.
// MyID qulflagan ism-familiya va tug'ilgan sana umuman yuborilmaydi (server o'zgarishni `identity_fields_locked` bilan rad etadi).
export function formToPayload(v) {
  return {
    ...(v.namesLocked
      ? {}
      : { first_name: v.firstName.trim(), last_name: v.lastName.trim(), birth_date: v.birthDate }),
    email: v.email.trim(),
    gender_id: v.genderId,
    region_id: v.regionId,
    district_id: v.districtId,
    address: v.address.trim(),
    default_gps_lat: v.gpsLat,
    default_gps_lng: v.gpsLng,
    default_landmark: v.landmark.trim(),
  };
}
