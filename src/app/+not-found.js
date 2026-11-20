import { Redirect } from 'expo-router';

// Tashqi havola ilovada yo'q ekranga olib kelsa (masalan, saytning ilovada bo'lmagan sahifasi) — bosh ekran,
// "Unmatched Route" sahifasi emas. Kirgan foydalanuvchini `index` o'zi bosh sahifaga o'tkazadi.
export default function NotFoundRoute() {
  return <Redirect href="/" />;
}
