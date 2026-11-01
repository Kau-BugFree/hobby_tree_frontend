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
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    const region = toDistrict(addr);
    return region ? { ok: true, region } : { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
