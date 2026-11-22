/**
 * O-05-1 약관 동의 (4/4 확인 다음, 추천 받기 전)
 * - 백엔드는 온보딩을 마친 회원에게만 추천(API-14)·하비 코치(API-34)를 준다 → 추천 전에 동의를 받는다
 * - 약관 목록은 API-10 선택지 응답의 terms 그대로 (서버가 가진 약관만 API-13에 보냄), 못 받으면 명세 약관 8종 (api/mappers.ts mergeTerms)
 * - 전체 동의 + 약관별 체크 + ‘보기’로 본문 펼치기
 * - 닉네임 입력 + 연령대 선택(필수 프로필) — API-13이 '필수 프로필'을 확인해서 API-06으로 먼저 저장한다
 *   닉네임 규칙: 2~12자, 한글·영문·숫자·밑줄 (API-06)
 * - ‘동의하고 추천 받기’: 닉네임 + 연령대 + 필수 약관 동의가 있어야 활성 → O-05-2 추천 준비
 *   (거기서 API-11 취향 저장 → API-06 닉네임·연령대 저장 → API-13 온보딩 완료 → API-14 추천 생성 순서로 보냄)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { getOnboardingOptions } from '../../api/endpoints';
import { ageToServer, mergeTerms, NICKNAME_MAX, NICKNAME_RULE, nicknameError } from '../../api/mappers';
import type { Terms } from '../../api/types';
import { AppText, Button, Card, ChipGroup, InfoNote, Screen } from '../../components';
import { AGE_OPTIONS, AgeOption } from '../../data/my';
import { CheckRow } from '../../components/my/MyParts';
import { OnboardingBar, StepTitle } from '../../components/onboarding/OnboardingParts';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS, TYPO } from '../../theme';

const STEP = {
  eyebrow: '마지막 · 약관 동의',
  title: '추천을 받기 전에\n약관을 확인해 주세요',
  lead: '필수 약관에 동의하면 시작할 수 있어요. 선택 약관은 나중에 바꿀 수 있어요.',
};

const labelOf = (t: Terms) => `${t.isRequired ? '[필수]' : '[선택]'} ${t.title}`;

export default function OnboardingTerms() {
  const { state, update, updateServer } = useAppState();
  const { signedIn } = useSession();
  const [terms, setTerms] = useState<Terms[]>(() => mergeTerms(state.server.options?.terms));
  const [agreed, setAgreed] = useState<Record<number, boolean>>(() =>
    Object.fromEntries((state.server.agreements ?? []).map((a) => [a.termsId, a.agreed])),
  );
  const [open, setOpen] = useState<number | null>(null);
  // 연령대는 기본값 없이 직접 고르게 한다 (전에 골랐으면 그 값)
  const [age, setAge] = useState<AgeOption | null>(state.server.ageRange ? state.profile.age : null);
  const [nickname, setNickname] = useState(state.server.nickname ?? '');
  const nickErr = nicknameError(nickname);
  const nickOk = NICKNAME_RULE.test(nickname.trim());

  // 로그인 상태인데 선택지(약관)를 아직 못 받았으면 API-10으로 받아 온다
  useEffect(() => {
    if (!signedIn || state.server.options?.terms?.length) return;
    getOnboardingOptions()
      .then((o) => {
        updateServer({ options: o });
        setTerms(mergeTerms(o.terms));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const required = useMemo(() => terms.filter((t) => t.isRequired), [terms]);
  const allAgreed = terms.every((t) => agreed[t.termsId]);
  const ready = required.every((t) => agreed[t.termsId]) && !!age && nickOk;

  const toggle = (id: number) => setAgreed((a) => ({ ...a, [id]: !a[id] }));
  const toggleAll = () => setAgreed(allAgreed ? {} : Object.fromEntries(terms.map((t) => [t.termsId, true])));

  /** 동의 내용을 담아 추천 준비(O-05-2)로 — 실제 저장(API-13)은 거기서 취향 저장 직후에 한다 */
  const onSubmit = () => {
    if (!age || !nickOk) return;
    const nick = nickname.trim();
    update({ userName: nick, profile: { ...state.profile, age } });
    updateServer({
      nickname: nick,
      ageRange: ageToServer(age),
      agreements: terms.map((t) => ({ termsId: t.termsId, version: t.version, agreed: !!agreed[t.termsId] })),
    });
    go('/onboarding/summary');
  };

  return (
    <Screen
      header={<OnboardingBar progress="4/4" filled={4} />}
      footer={<Button label="동의하고 추천 받기" disabled={!ready} onPress={onSubmit} />}
      contentStyle={styles.content}
    >
      <StepTitle step={STEP} />
      <Card radius={22} gap={8}>
        <AppText variant="body16Bold" color="textPrimary">
          [필수] 닉네임
        </AppText>
        <View style={[styles.inputBox, nickErr ? styles.inputBoxError : null]}>
          <TextInput
            value={nickname}
            onChangeText={(t) => setNickname(t.replace(/\s/g, '').slice(0, NICKNAME_MAX))}
            maxLength={NICKNAME_MAX}
            placeholder="2~12자 · 한글·영문·숫자·밑줄"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="닉네임"
            style={[TYPO.callout14Regular, styles.input]}
          />
          <AppText variant="caption12Medium" color="textMuted">
            {`${nickname.length}/${NICKNAME_MAX}`}
          </AppText>
        </View>
        {nickErr ? (
          <AppText variant="caption12Medium" color="accentDanger">
            {nickErr}
          </AppText>
        ) : (
          <AppText variant="caption12Medium" color="textMuted">
            홈과 MY에서 이 이름으로 불러 드려요.
          </AppText>
        )}
      </Card>
      <Card radius={22} gap={10}>
        <AppText variant="body16Bold" color="textPrimary">
          [필수] 연령대
        </AppText>
        <ChipGroup options={AGE_OPTIONS} value={age} onChange={setAge} />
        <AppText variant="caption12Medium" color="textMuted">
          연령대는 추천에 쓰지 않아요. MY › 프로필 관리에서 바꿀 수 있어요.
        </AppText>
      </Card>
      <Card radius={22} gap={4}>
        <CheckRow label="전체 동의 (선택 약관 포함)" checked={allAgreed} onToggle={toggleAll} />
        <View style={styles.divider} />
        {terms.map((t) => (
          <View key={t.termsId}>
            <CheckRow
              label={labelOf(t)}
              checked={!!agreed[t.termsId]}
              onToggle={() => toggle(t.termsId)}
              onView={t.content ? () => setOpen(open === t.termsId ? null : t.termsId) : undefined}
            />
            {open === t.termsId && t.content ? (
              <View style={styles.doc}>
                <AppText variant="caption12Medium" color="textBody">
                  {t.content}
                </AppText>
                <AppText variant="micro11Bold" color="textMuted">
                  {`버전 ${t.version}`}
                </AppText>
              </View>
            ) : null}
          </View>
        ))}
      </Card>
      <InfoNote text="동의한 약관과 버전은 서버에 기록돼요. 선택 약관에 동의하지 않아도 모든 기본 기능을 쓸 수 있어요." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgApp,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  inputBoxError: { borderColor: COLORS.accentDanger },
  input: { flex: 1, padding: 0, color: COLORS.textPrimary, includeFontPadding: false },
  divider: { height: 1, backgroundColor: COLORS.borderDefault, marginVertical: 4 },
  doc: { gap: 6, marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: COLORS.bgApp },
});
