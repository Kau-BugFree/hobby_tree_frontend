import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

export interface TouchableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 44dp 미만 요소는 true로 지정해 터치 영역을 넓힌다. */
  small?: boolean;
}

/** 클릭 가능한 모든 요소의 공통 래퍼: 눌림 시 opacity 0.7 피드백. */
export function Touchable({ style, small, hitSlop, children, ...rest }: TouchableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hitSlop ?? (small ? 8 : undefined)}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
