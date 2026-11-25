/**
 * M-04 위치 정보 사용 동의 (바텀 시트 오버레이)
 * - 수집 항목·이용 목적·보유 기간·제3자 제공 요약(FactRow ×4)
 * - [필수] 동의 2개(CheckRow): ‘보기’ → M-06 / M-07 전문
 * - ‘동의하고 현재 위치 찾기’: 두 동의 모두 체크해야 활성 → OS 권한(M-09) → 시·구 저장 → M-03
 *   권한 거부·실패 → M-08 직접 입력으로 교체
 * - ‘직접 입력할게요’ → M-08
 * 로그인 상태: API-43 위치 동의 기록(API-10 안내문 버전) → 현재 좌표 → API-42 활동 지역 설정(DEVICE · 서버가 지역으로 변환, 좌표 저장 안 함)
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, IconTile, InfoNote, OverlaySheet, useToast } from '../../components';
import { CheckRow } from '../../components/my/MyParts';
import { LOCATION_FACTS, LegalRow } from '../../data/terms';
import { useAppState } from '../../lib/appState';
import { ApiError, errorMessage } from '../../api/client';
import { searchRegions, setLocation } from '../../api/endpoints';
import { currentCoords, districtOf, locateDistrict } from '../../lib/location';
import { recordConsent } from '../../lib/locationConsent';
import { useSession } from '../../lib/session';
import { back, go, swap } from '../../lib/nav';
import { COLORS } from '../../theme';

function FactRow({ row }: { row: LegalRow }) {
  return (
    <View style={styles.fact}>
      <AppText variant="caption12Bold" color="textMuted" style={styles.factKey}>
        {row.k}
      </AppText>
      <AppText variant="caption12Medium" color="textPrimary" style={styles.flex}>
        {row.v}
      </AppText>
    </View>
  );
}

export default function LocationConsentSheet() {
  const { state, update } = useAppState();
  const { signedIn } = useSession();
  const toast = useToast();
  const [agree, setAgree] = useState({ terms: false, personal: false });
  const [busy, setBusy] = useState(false);
  const ready = agree.terms && agree.personal && !busy;

  /**
   * 서버: 동의 기록(API-43) → 좌표 → 지역 설정(API-42 DEVICE)
   * 서버가 좌표를 지역으로 못 바꾸면(LOCATION404_1 · 503_1 등) 기기에서 시·구를 찾아
   * API-41로 지역 ID를 검색한 뒤 API-42 MANUAL로 저장한다. 그래도 안 되면 직접 입력으로.
   */
  const onAgreeServer = async () => {
    setBusy(true);
    const fail = (title: string, sub: string) => {
      swap('/my/region');
      toast({ title, sub, icon: 'pin' });
    };
    try {
      let consentVersion: string;
      try {
        consentVersion = (await recordConsent(state.server.options, true)).version;
        update({ locationConsent: true });
      } catch (e) {
        return fail('위치 동의를 저장하지 못했어요', `${errorMessage(e)} · 지역을 직접 입력해 주세요`);
      }
      const pos = await currentCoords();
      if (!pos.ok) {
        return fail(pos.reason === 'denied' ? '위치 권한이 꺼져 있어요' : '현재 위치를 찾지 못했어요', '지역을 직접 입력해 주세요');
      }
      let saved: string | null = null;
      let serverError: unknown = null;
      try {
        const res = await setLocation({ source: 'DEVICE', latitude: pos.latitude, longitude: pos.longitude, consentVersion });
        saved = res.location?.fullName ?? res.location?.name ?? null;
      } catch (e) {
        serverError = e;
      }
      // 서버 변환 실패 → 기기에서 시·구 찾기 → API-41 검색 → MANUAL 저장
      if (!saved) {
        const district = await districtOf(pos.latitude, pos.longitude);
        const gu = district?.split(' ').pop();
        if (gu) {
          try {
            const found = (await searchRegions({ keyword: gu, level: 'SIGUNGU', size: 10 })).items ?? [];
            const sido = district!.split(' ')[0];
            const hit = found.find((r) => r.name === gu && (!sido || (r.fullName ?? '').includes(sido))) ?? found.find((r) => r.name === gu) ?? found[0];
            if (hit) {
              const res = await setLocation({ source: 'MANUAL', regionId: hit.regionId });
              saved = res.location?.fullName ?? res.location?.name ?? hit.fullName ?? hit.name;
            }
          } catch (e) {
            serverError = serverError ?? e;
          }
        }
      }
      if (!saved) {
        const code = serverError instanceof ApiError ? ` (${serverError.code})` : '';
        return fail('현재 위치로 지역을 정하지 못했어요', `${serverError ? errorMessage(serverError) : '지역을 찾지 못했어요'}${code} · 지역을 직접 입력해 주세요`);
      }
      update({ region: saved });
      back();
      toast({ title: `지역을 ‘${saved}’로 정했어요`, sub: '좌표는 지역을 찾는 데만 쓰고 저장하지 않아요', icon: 'pin' });
    } finally {
      setBusy(false);
    }
  };

  const onAgree = async () => {
    if (signedIn) return onAgreeServer();
    setBusy(true);
    const res = await locateDistrict();
    setBusy(false);
    if (res.ok) {
      update({ region: res.region, locationConsent: true });
      back();
      toast({ title: `지역을 ‘${res.region}’로 정했어요`, sub: '좌표는 저장하지 않고 바로 지웠어요', icon: 'pin' });
      return;
    }
    update({ locationConsent: res.reason !== 'denied' });
    swap('/my/region');
    toast({
      title: res.reason === 'denied' ? '위치 권한이 꺼져 있어요' : '현재 위치를 찾지 못했어요',
      sub: '지역을 직접 입력해 주세요',
      icon: 'pin',
    });
  };

  return (
    <OverlaySheet>
      <IconTile size={56} radius={999} style={styles.center}>
        <IconSlot name="pin" size={26} color="brandDeep" />
      </IconTile>
      <AppText variant="title22Bold" color="textPrimary" align="center">
        위치 정보를 사용할까요?
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        현재 위치로 지역을 정하고, 가까운 클래스·체험 장소를 보여 드려요
      </AppText>
      <View style={styles.facts}>
        {LOCATION_FACTS.map((r) => (
          <FactRow key={r.k} row={r} />
        ))}
      </View>
      <View>
        <CheckRow
          label="[필수] 위치기반서비스 이용약관 동의"
          checked={agree.terms}
          onToggle={() => setAgree((a) => ({ ...a, terms: !a.terms }))}
          onView={() => go('/my/terms-location')}
        />
        <CheckRow
          label="[필수] 개인위치정보 수집·이용 동의"
          checked={agree.personal}
          onToggle={() => setAgree((a) => ({ ...a, personal: !a.personal }))}
          onView={() => go('/my/terms-personal')}
        />
      </View>
      <InfoNote text="동의하지 않아도 지역을 직접 입력할 수 있어요. 동의는 MY > 프로필 관리에서 언제든 철회할 수 있어요. 동의하면 다음에 휴대폰 위치 권한 요청이 떠요." />
      <Button label={busy ? '현재 위치 찾는 중…' : '동의하고 현재 위치 찾기'} disabled={!ready} onPress={onAgree} />
      <Button label="직접 입력할게요" variant="ghost" onPress={() => swap('/my/region')} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignSelf: 'center' },
  facts: { gap: 8, padding: 14, borderRadius: 18, backgroundColor: COLORS.bgApp },
  fact: { flexDirection: 'row', gap: 10 },
  factKey: { width: 64 },
});
