/**
 * 취미별 활동 카탈로그 (체험 탭 E-01 ~ E-03).
 * 원본: HobbyTree 취미별 성장 지도 HTML(2026.10.09 초안)에서 화면에 필요한 필드만 추린 MOCK_DATA.
 * TODO(API): GET /hobbies/:key/catalog 로 교체 (앱 번들에 넣지 않기)
 */
import type { HobbyKey } from '../../components/Graphics';
import coffee from './coffee.json';
import cooking from './cooking.json';
import music from './music.json';
import reading from './reading.json';
import running from './running.json';

export interface CatalogCard {
  id: string;
  level: number;
  title: string;
  group: string;
  goal: string;
  minutes: number;
  time: string;
  tools: string[];
  materials: string[];
  steps: string[];
  checks: string[];
  safety: string[];
  light: string;
}

export interface Catalog {
  key: string;
  hobby: string;
  name: string;
  intro: string;
  levels: string[];
  summaries: string[];
  defaultCost: string;
  cards: CatalogCard[];
}

export const CATALOG: Record<HobbyKey, Catalog> = {
  커피: coffee as Catalog,
  요리: cooking as Catalog,
  악기: music as Catalog,
  독서: reading as Catalog,
  러닝: running as Catalog,
};

export const catalogOf = (hobby: string | undefined): Catalog => CATALOG[(hobby as HobbyKey) ?? '커피'] ?? CATALOG.커피;

export const cardsOfLevel = (c: Catalog, level: number) => c.cards.filter((x) => x.level === level);

export const findCard = (id: string | undefined): { catalog: Catalog; card: CatalogCard } | null => {
  for (const c of Object.values(CATALOG)) {
    const card = c.cards.find((x) => x.id === id);
    if (card) return { catalog: c, card };
  }
  return null;
};

/** 단계 카드에 쓰는 한 번 소요 시간 범위 (5분 미만 이상치는 제외) */
export const minuteRange = (cards: CatalogCard[]) => {
  const ms = cards.map((c) => c.minutes).filter((m) => m >= 5);
  if (!ms.length) return '';
  const lo = Math.min(...ms);
  const hi = Math.max(...ms);
  return lo === hi ? `${lo}분` : `${lo}~${hi}분`;
};
