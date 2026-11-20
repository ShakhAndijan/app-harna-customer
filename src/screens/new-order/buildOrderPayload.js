// Forma holatidan POST /api/v1/orders uchun payload yig'adi.
// (rasmlar alohida yuklanadi va `photo_temp_keys` sifatida keyin qo'shiladi)

import { TIMING_KIND_MAP } from './constants';
import { toISODate } from './utils';

export default function buildOrderPayload({
  description,
  categoryIds,
  orderWorker,
  phone,
  regionId,
  districtId,
  gpsLat,
  gpsLng,
  street,
  mahalla,
  entrance,
  floor,
  when,
  whenDate,
  whenWindow,
  workerCount,
  backupPhone,
  requirePhoto,
  requireVerified,
  minRating,
  minExperience,
  extraRequirements,
  pricingType,
  hourlyRate,
  estimatedHours,
  fixedPrice,
  paymentMethod,
  orgSiteId,
  againFrom,
  keptPhotos,
  quote,
}) {
  // Narxni platforma belgilagan buyurtma butun ish uchun shu summada ketadi: `budget` — mijoz ko'rgan summaga
  // rozilik belgisi (server o'zinikiga tenglaydi, farq qilsa 409 `platform_price_changed`). Viloyat noma'lum
  // bo'lsa summa yuborilmaydi, server o'zi to'ldiradi. Yozilgan narx va soatbay bunga yetib bormaydi.
  const priced = quote?.kind === 'priced';
  // Aniq ustaga buyurtma berilganda ishchiga talablar yuborilmaydi (faqat "boshqa talablar" matni).
  const targeted = orderWorker?.id != null;
  return {
    description: description.trim(),
    category_id: categoryIds[0] ?? null,
    task_category_ids: categoryIds,
    worker_id: orderWorker?.id ?? null,
    // E'londan "Shu xizmatni buyurtma qilish" orqali kelgan bo'lsa, buyurtma shu e'longa bog'lanadi.
    listing_id: orderWorker?.listingId ?? null,
    contact_phone: `+998${phone.trim()}`,
    backup_phone: backupPhone?.trim() ? `+998${backupPhone.trim()}` : null,
    region_id: regionId,
    district_id: districtId,
    gps_lat: gpsLat,
    gps_lng: gpsLng,
    location_landmark: street.trim() || null,
    mahalla: mahalla?.trim() || null,
    entrance: entrance.trim() || null,
    floor: floor.trim() || null,
    timing_kind: when ? TIMING_KIND_MAP[when] : null,
    // "Bugun" tanlanganda ham sana yuboriladi (telefondagi bugungi sana), "Sana tanlash"da — tanlangan kun.
    scheduled_date:
      when === 'date' && whenDate
        ? toISODate(whenDate)
        : when === 'today'
          ? toISODate(new Date())
          : null,
    // «Qaysi vaqtda kelsin?»: faqat "Bugun" yoki tanlangan sana bilan ("10:00"); boshqasida server 422 qaytaradi.
    ...(whenWindow && (when === 'today' || when === 'date') ? { window_start: whenWindow } : {}),
    workers_needed: workerCount,
    require_photo: targeted ? null : requirePhoto,
    require_verified: targeted ? null : requireVerified || null,
    min_rating: targeted ? null : minRating || null,
    min_experience_years: targeted ? null : minExperience || null,
    extra_requirements: extraRequirements?.trim() || null,
    price_mode: priced ? 'fixed' : pricingType,
    hourly_rate:
      !priced && pricingType === 'hourly' && hourlyRate.trim() ? Number(hourlyRate) : null,
    estimated_hours:
      !priced && pricingType === 'hourly' && estimatedHours.trim() ? Number(estimatedHours) : null,
    ...(priced
      ? quote.exact != null
        ? { budget: quote.exact }
        : {}
      : { budget: pricingType === 'fixed' && fixedPrice.trim() ? Number(fixedPrice) : null }),
    payment_method: paymentMethod,
    org_site_id: orgSiteId ?? null,
    // "Yana chaqirish": eski buyurtma rasmlari qayta yuklanmaydi; rasm qolmagan bo'lsa ikkalasi ham yuborilmaydi.
    ...(againFrom != null && keptPhotos?.length > 0
      ? { again_from: Number(againFrom), kept_photos: keptPhotos }
      : {}),
  };
}
