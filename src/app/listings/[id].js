import { Redirect, useLocalSearchParams } from 'expo-router';

// Saytdagi e'lon havolasi (https://harna.uz/listings/{id}) ilovada ochilganda — e'lon sahifasiga yo'naltiradi.
export default function ListingLink() {
  const { id } = useLocalSearchParams();
  return <Redirect href={{ pathname: '/listing/[id]', params: { id: String(id) } }} />;
}
