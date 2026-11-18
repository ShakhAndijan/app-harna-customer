import { useLayoutEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUstaStyles } from '../styles';

// Instagram uslubidagi tablar: monoxrom ikonlar, faol tabda to'ldirilgan ikon va pastida yupqa chiziq.
export function ProfileTabs({ tabs, value, onChange }) {
  const { C } = useUstaStyles();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.line,
        marginHorizontal: -20,
      }}
    >
      {tabs.map((tb) => {
        const on = tb.value === value;
        return (
          <TouchableOpacity
            key={tb.value}
            onPress={() => onChange(tb.value)}
            activeOpacity={0.6}
            accessibilityRole="tab"
            accessibilityLabel={tb.label}
            accessibilityState={{ selected: on }}
            style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name={on ? tb.icon : `${tb.icon}-outline`}
              size={27}
              color={on ? C.txt : C.dim2}
            />
            <View
              style={{
                position: 'absolute',
                alignSelf: 'center',
                width: '62%',
                bottom: 0,
                height: 2,
                backgroundColor: on ? C.txt : 'transparent',
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tablar orasida barmoq bilan surish: joriy oyna barmoq ketidan siljiydi, keyingisi yonidan sekin kirib keladi.
export function SwipeTabs({ order, value, onChange, render }) {
  const [width, setWidth] = useState(0);
  const [tx] = useState(() => new Animated.Value(0));
  const [dir, setDir] = useState(0); // +1: keyingi tab o'ngda, -1: oldingi tab chapda
  const index = order.indexOf(value);

  const pan = useMemo(() => {
    const finish = (toValue, then) =>
      Animated.timing(tx, { toValue, duration: 220, useNativeDriver: false }).start(then);
    // Surish 12 px dan keyin tutib olinadi: shu boshlang'ich siljish ayrib tashlanadi, aks holda oyna sakrab ketadi.
    const base = { v: 0 };
    return PanResponder.create({
      onPanResponderGrant: (_, g) => {
        base.v = g.dx;
      },
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const dx = g.dx - base.v;
        const d = dx < 0 ? 1 : -1;
        const hasNeighbor = index + d >= 0 && index + d < order.length;
        setDir((p) => (p === d ? p : d));
        // Chekkada boshqa tab yo'q: siljish qarshilik bilan, ozgina.
        tx.setValue(hasNeighbor ? dx : dx * 0.25);
      },
      onPanResponderRelease: (_, g) => {
        const dx = g.dx - base.v;
        const d = dx < 0 ? 1 : -1;
        const target = index + d;
        const can = target >= 0 && target < order.length;
        const go = can && (Math.abs(dx) > width * 0.25 || Math.abs(g.vx) > 0.5);
        if (go) {
          finish(-d * width, () => {
            onChange(order[target]);
            setDir(0);
          });
        } else {
          finish(0, () => setDir(0));
        }
      },
      onPanResponderTerminate: () => finish(0, () => setDir(0)),
    });
  }, [index, order, width, tx, onChange]);

  // Tab almashgach siljish bo'yoqdan oldin (layout bosqichida) nolga qaytariladi: bir kadr ham bo'sh/eski holat ko'rinmaydi.
  useLayoutEffect(() => {
    tx.setValue(0);
  }, [value, tx]);

  const neighbor =
    dir !== 0 && index + dir >= 0 && index + dir < order.length ? order[index + dir] : null;

  return (
    <View
      style={{ overflow: 'hidden', marginHorizontal: -20 }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <Animated.View style={{ transform: [{ translateX: tx }] }}>
        <View style={{ paddingHorizontal: 20 }}>{render(value)}</View>
        {neighbor && width > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: dir * width,
              width,
              paddingHorizontal: 20,
            }}
          >
            {render(neighbor)}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
