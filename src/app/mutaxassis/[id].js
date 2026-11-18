import { Redirect, useLocalSearchParams } from 'expo-router';

// Saytdagi usta sahifasi havolasi (https://harna.uz/mutaxassis/{id}) ilovada ochilganda — usta profiliga yo'naltiradi.
export default function MutaxassisLink() {
  const { id } = useLocalSearchParams();
  return <Redirect href={{ pathname: '/usta/[id]', params: { id: String(id) } }} />;
}
