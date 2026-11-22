import { useWindowDimensions } from 'react-native';

/**
 * 좁은 화면 기준 (dp). 갤럭시 S 시리즈 기본(360dp)·아이폰 SE(375pt)처럼
 * 가로가 380 미만이면 헤더 버튼을 아이콘만 남기는 등 '컴팩트' 배치를 쓴다.
 */
export const COMPACT_WIDTH = 380;

export function useCompact() {
  const { width } = useWindowDimensions();
  return width < COMPACT_WIDTH;
}

/**
 * 휴대폰 '글자 크기' 설정을 키워도 레이아웃이 잘리지 않게 막는 최대 배율.
 * (1.2배까지는 따라 커지고 그 이상은 고정)
 */
export const MAX_FONT_SCALE = 1.2;
