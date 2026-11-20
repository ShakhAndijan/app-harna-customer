import VerifyIdentityScreen from '../../screens/VerifyIdentityScreen';
import useGoBack from '../../navigation/useGoBack';

// `harna://cabinet/verify?session_id&status&auth_code` — MyID tekshiruvidan qaytish manzili. Android
// havolani to'g'ridan-to'g'ri routerga beradi (yoki ilovani shu havola bilan yangidan ishga tushiradi):
// ekran parametrlarni o'zi o'qib, javobni qayta ishlaydi (src/utils/myid.js).
export default function CabinetVerifyRoute() {
  return <VerifyIdentityScreen onBack={useGoBack()} />;
}
