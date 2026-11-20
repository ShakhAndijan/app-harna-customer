import { useLocalSearchParams } from 'expo-router';
import RequestScreen from '../../screens/RequestScreen';
import useGoBack from '../../navigation/useGoBack';

// Ochiq buyurtmani jonli kuzatish: holat, narx kelishuvi, rad etish va boshqa ustaga yuborish.
export default function RequestRoute() {
  // `pin=1`: «Usta manzil nuqtasini so'radi» bildirishnomasidan ochilgan — pin kartasi yorqin turadi.
  const { id, pin } = useLocalSearchParams();
  return <RequestScreen orderId={Number(id)} onBack={useGoBack()} askedPin={pin === '1'} />;
}
