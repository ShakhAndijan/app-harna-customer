import { useRouter } from 'expo-router';
import LandingScreen from '../screens/LandingScreen';
import { ustaRoute } from '../navigation/params';

export default function LandingRoute() {
  const router = useRouter();
  return (
    <LandingScreen
      onLogin={() => router.push('/login')}
      // VAQTINCHA yashirilgan: hisobsiz buyurtma tugmasi. Qaytarish: onOrder={() => router.push('/guest-order')}
      onHelp={() => router.push('/help')}
      onSelectUsta={(usta) => router.push(ustaRoute(usta))}
    />
  );
}
