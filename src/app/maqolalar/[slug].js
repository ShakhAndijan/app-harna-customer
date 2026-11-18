import { Redirect, useLocalSearchParams } from 'expo-router';

// Saytdagi maqola havolasi (https://harna.uz/maqolalar/{slug}) ilovada ochilganda — maqola sahifasiga yo'naltiradi.
export default function ArticleLink() {
  const { slug } = useLocalSearchParams();
  return <Redirect href={{ pathname: '/article/[slug]', params: { slug: String(slug) } }} />;
}
