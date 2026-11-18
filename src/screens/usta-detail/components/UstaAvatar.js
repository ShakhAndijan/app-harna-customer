import { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useUstaStyles } from '../styles';
import { encodeImageUri } from '../utils';
import useThumb from '../../../hooks/useThumb';

// Ustaning surati; rasm yo'q yoki yuklanmasa — rangli fonda bosh harf.
export default function UstaAvatar({ initial, size, bgColor, uri }) {
  const { C, st } = useUstaStyles();
  const [failed, setFailed] = useState(false);
  const { src, onError: thumbError } = useThumb(uri, size <= 96);
  const showImage = uri && !failed;

  return (
    <View
      style={[
        st.avatar,
        { width: size, height: size, backgroundColor: showImage ? C.card3 : bgColor },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: encodeImageUri(src) }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => {
            if (!thumbError()) setFailed(true);
          }}
        />
      ) : (
        <Text style={st.avatarTxt}>{initial}</Text>
      )}
    </View>
  );
}
