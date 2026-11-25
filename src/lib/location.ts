import * as Location from 'expo-location';

/**
 * M-04 ‘동의하고 현재 위치 찾기’
 * 1) OS 위치 권한 요청 (M-09 시스템 알림 — 직접 그리지 않음)
 * 2) 현재 좌표 1회 조회 (백그라운드 수집 없음)
 * 3) 기기에서 시·구로 바꾸고 좌표는 버린다 (약관 제8조 ③)
 *
 * TODO(API): 서버 저장은 시·구 문자열(또는 행정구역 코드)만 — PATCH /me/profile { region }
 * 참고: 국내 행정구역 정확도가 필요하면 좌표를 서버로 보내지 말고, 앱에서 지도 SDK(카카오·네이버) 역지오코딩 결과의 시·구만 전송.
 */
export type LocateResult = { ok: true; region: string } | { ok: false; reason: 'denied' | 'unavailable' };

/** 위치 찾기 최대 대기 시간 — 에뮬레이터처럼 GPS 신호가 없으면 getCurrentPositionAsync가 끝나지 않는다 */
const LOCATE_TIMEOUT_MS = 10000;

/**
 * 현재 좌표 1회. 위치 서비스가 꺼져 있으면 바로 실패,
 * 10초 안에 못 찾으면 최근 10분 안의 마지막 위치를 쓰고, 그것도 없으면 실패(직접 입력으로).
 */
async function getPosition(): Promise<Location.LocationObject | null> {
  if (!(await Location.hasServicesEnabledAsync().catch(() => false))) return null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATE_TIMEOUT_MS));
  const pos = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null), timeout]);
  if (pos) return pos;
  return Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(() => null);
}

const SIDO_SUFFIX = /(특별시|광역시|특별자치시|특별자치도|도)$/;

export function toDistrict(addr: Location.LocationGeocodedAddress | undefined): string | null {
  if (!addr) return null;
  const sido = (addr.region ?? addr.city ?? '').replace(SIDO_SUFFIX, '');
  const gu = [addr.district, addr.subregion, addr.city].find((v) => v && /(구|군|시)$/.test(v) && v !== addr.region);
  if (!sido && !gu) return null;
  return [sido, gu].filter(Boolean).join(' ');
}

export async function locateDistrict(): Promise<LocateResult> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== Location.PermissionStatus.GRANTED) return { ok: false, reason: 'denied' };
  try {
    const pos = await getPosition();
    if (!pos) return { ok: false, reason: 'unavailable' };
    const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    const region = toDistrict(addr);
    return region ? { ok: true, region } : { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * 서버 연동용: 현재 좌표 1회 (API-42 DEVICE에 바로 넘기고 앱에는 남기지 않는다)
 * 서버가 좌표를 지역 ID로 바꾸고 원시 좌표는 저장하지 않는다 (명세 API-42)
 */
export type CoordsResult = { ok: true; latitude: number; longitude: number } | { ok: false; reason: 'denied' | 'unavailable' };
export async function currentCoords(): Promise<CoordsResult> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== Location.PermissionStatus.GRANTED) return { ok: false, reason: 'denied' };
  try {
    const pos = await getPosition();
    if (!pos) return { ok: false, reason: 'unavailable' };
    return { ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** 좌표 → ‘서울 마포구’ (기기에서 역지오코딩, 좌표는 저장하지 않음) */
export async function districtOf(latitude: number, longitude: number): Promise<string | null> {
  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return toDistrict(addr);
  } catch {
    return null;
  }
}
