import { Redirect } from 'expo-router';

// `harna://cabinet/verify` — server shaxsni tasdiqlash oqimidan (MyID) qaytaradigan manzil.
// Android uni to'g'ridan-to'g'ri router'ga uzatishi mumkin: tasdiqlash ekraniga yo'naltiriladi.
export default function CabinetVerifyRoute() {
  return <Redirect href="/verify-identity" />;
}
