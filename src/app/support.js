import { useLocalSearchParams } from 'expo-router';
import SupportScreen from '../screens/SupportScreen';
import GuestSupportScreen from '../screens/GuestSupportScreen';
import useGoBack from '../navigation/useGoBack';
import { useAuth } from '../context/AuthContext';

// Murojaatlarim / Takliflarim: `?kind=question|suggestion`. Kirmagan foydalanuvchi uchun — ism, aloqa va
// (yoqilgan bo'lsa) Turnstile bilan mehmon shakli.
export default function SupportRoute() {
  const { kind } = useLocalSearchParams();
  const { signedIn } = useAuth();
  const goBack = useGoBack();
  const asked = Array.isArray(kind) ? kind[0] : kind;
  const Screen = signedIn ? SupportScreen : GuestSupportScreen;
  return <Screen kind={asked} onBack={goBack} />;
}
