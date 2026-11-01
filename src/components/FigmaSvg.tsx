import React from 'react';
import { SvgXml } from 'react-native-svg';

import { FIGMA_SVG } from '../assets/figmaSvg';

/** Figma 컴포넌트에서 내려받은 SVG가 있으면 true */
export function hasFigmaSvg(name: string) {
  return Boolean(FIGMA_SVG[name]);
}

/**
 * Figma 컴포넌트 그래픽 (src/assets/figmaSvg.ts).
 * 해당 이름의 그래픽이 없으면 아무것도 그리지 않으니, 호출하는 쪽에서 hasFigmaSvg로 대체 UI를 정한다.
 */
export function FigmaSvg({ name, width, height }: { name: string; width: number | `${number}%`; height: number }) {
  const xml = FIGMA_SVG[name];
  if (!xml) return null;
  return <SvgXml xml={xml} width={width} height={height} />;
}
