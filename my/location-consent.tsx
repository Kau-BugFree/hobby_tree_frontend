/**
 * M-04 위치 정보 사용 동의 (바텀 시트 오버레이)
 * - 수집 항목·이용 목적·보유 기간·제3자 제공 요약(FactRow ×4)
 * - [필수] 동의 2개(CheckRow): ‘보기’ → M-06 / M-07 전문
 * - ‘동의하고 현재 위치 찾기’: 두 동의 모두 체크해야 활성 → OS 권한(M-09) → 시·구 저장 → M-03
 *   권한 거부·실패 → M-08 직접 입력으로 교체
 * - ‘직접 입력할게요’ → M-08
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, IconTile, InfoNote, OverlaySheet, useToast } from '../../components';
import { CheckRow } from '../../components/my/MyParts';
import { LOCATION_FACTS, LegalRow } from '../../data/terms';
import { useAppState } from '../../lib/appState';
import { locateDistrict } from '../../lib/location';
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
  const { update } = useAppState();
  const toast = useToast();
  const [agree, setAgree] = useState({ terms: false, personal: false });
  const [busy, setBusy] = useState(false);
  const ready = agree.terms && agree.personal && !busy;

  const onAgree = async () => {
    setBusy(true);
    // TODO(API): POST /me/consents { location_terms: '1.0', personal_location: '1.0', agreedAt }
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
