/**
 * M-03 프로필 관리
 * - 사진(96) + 카메라 배지 + ‘사진 변경’ → M-05 시트
 * - 프로필: 닉네임(TextInput) · 연령대(단일 칩) · 지역(→ M-08 직접 입력, ‘현재 위치’ → M-04 동의 시트)
 * - 추천 조건: 관심 취미(복수) · 꼭 피하고 싶은 조건(복수, ‘없음’ 배타)
 * - 예산: 월/1회 슬라이더 · 시간: 일주일/1회 단일 칩
 * - ‘저장하기’ → 상태 반영 후 M-01로 돌아감. 화면 안 값은 저장 전까지 로컬 상태로만 바뀐다.
 * 로그인 상태: 닉네임·연령대는 API-06 PATCH /users/me로 서버에도 저장 (실패하면 화면에 남고 안내)
 * TODO(API): 나머지 항목(관심 취미·예산 등)은 취향 API-11과 연결 예정
 */
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, ChipGroup, IconSlot, InfoNote, Screen, TopBar, Touchable, useToast } from '../../components';
import { Avatar, BudgetSlider, FieldLabel, FormSection } from '../../components/my/MyParts';
import {
  AGE_OPTIONS,
  BUDGET_SLIDERS,
  hobbyToInterest,
  INTEREST_OPTIONS,
  InterestOption,
  interestToHobby,
  ONCE_TIME_OPTIONS,
  ProfileData,
  WEEK_TIME_OPTIONS,
} from '../../data/my';
import { STEP3 } from '../../data/onboarding';
import { errorMessage } from '../../api/client';
import { updateProfile } from '../../api/endpoints';
import { ageToServer, NICKNAME_MAX, nicknameError } from '../../api/mappers';
import { nextSelection, useAppState } from '../../lib/appState';
import { useSession } from '../../lib/session';
import { back, go } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

/** Q09 ‘반드시 제외’ 선택지 (‘직접 입력’은 온보딩에서만 받음) */
const EXCLUDE_GROUP = STEP3.questions.flatMap((q) => q.groups).find((g) => g.key === 'q09Exclude');
const EXCLUDE_OPTIONS = (EXCLUDE_GROUP?.options ?? []).filter((o) => o !== '직접 입력');
const EXCLUDE_EXCLUSIVE = EXCLUDE_GROUP?.exclusive ?? ['없음'];

const NICK_MAX = NICKNAME_MAX;

export default function ProfileScreen() {
  const { state, update, setAnswer } = useAppState();
  const toast = useToast();
  const [nick, setNick] = useState(state.userName);
  const [profile, setProfile] = useState<ProfileData>(state.profile);
  const [interests, setInterests] = useState<InterestOption[]>(state.picked.map(hobbyToInterest));
  const [exclude, setExclude] = useState<string[]>(
    Array.isArray(state.answers.q09Exclude) ? state.answers.q09Exclude : [],
  );
  const patch = (p: Partial<ProfileData>) => setProfile((cur) => ({ ...cur, ...p }));
  const { signedIn } = useSession();
  const [saving, setSaving] = useState(false);
  const nickErr = signedIn ? nicknameError(nick) : null;
  const canSave = nick.trim().length > 0 && interests.length > 0 && !nickErr && !saving;

  const onSave = async () => {
    if (signedIn) {
      setSaving(true);
      try {
        await updateProfile({ nickname: nick.trim(), ageRange: ageToServer(profile.age) });
      } catch (e) {
        toast({ title: '프로필을 저장하지 못했어요', sub: errorMessage(e), icon: 'info' });
        return;
      } finally {
        setSaving(false);
      }
    }
    update({ userName: nick.trim(), profile, picked: interests.map(interestToHobby) });
    setAnswer('q09Exclude', exclude);
    back();
    toast({ title: '프로필을 저장했어요', sub: '바뀐 정보로 추천을 다시 맞춰요', icon: 'check' });
  };

  const onWithdraw = () => {
    // TODO(API): DELETE /me/consents/location → 서버에 저장된 시·구 정보도 함께 삭제
    update({ locationConsent: false });
    toast({ title: '위치 정보 동의를 철회했어요', sub: '지역은 직접 입력한 값으로만 써요', icon: 'check' });
  };

  return (
    <Screen
      keyboard
      header={<TopBar title="프로필 관리" />}
      footer={<Button label={saving ? '저장하는 중…' : '저장하기'} disabled={!canSave} onPress={onSave} />}
      contentStyle={styles.content}
    >
      <View style={styles.photo}>
        <Touchable accessibilityLabel="프로필 사진 변경" onPress={() => go('/my/photo-sheet')}>
          <Avatar size={96} name={nick || state.userName} photoUri={state.profilePhotoUri} />
          <View style={styles.badge}>
            <IconSlot name="camera" size={16} color="textOnDark" />
          </View>
        </Touchable>
        <Touchable small accessibilityLabel="사진 변경" onPress={() => go('/my/photo-sheet')}>
          <AppText variant="caption12Bold" color="brandPrimary">
            사진 변경
          </AppText>
        </Touchable>
      </View>

      <FormSection title="프로필">
        <View style={styles.field}>
          <FieldLabel label="닉네임" right={`${nick.length}/${NICK_MAX}`} />
          <TextInput
            value={nick}
            onChangeText={(t) => setNick(t.replace(/\s/g, '').slice(0, NICK_MAX))}
            maxLength={NICK_MAX}
            placeholder="닉네임"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="done"
            accessibilityLabel="닉네임"
            style={[TYPO.body16Regular, styles.input]}
          />
          {nickErr ? (
            <AppText variant="caption12Medium" color="accentDanger">
              {nickErr}
            </AppText>
          ) : null}
        </View>
        <View style={styles.field}>
          <FieldLabel label="연령대" hint="선택" />
          <ChipGroup options={AGE_OPTIONS} value={profile.age} onChange={(age) => patch({ age })} />
        </View>
        <View style={styles.field}>
          <FieldLabel label="지역" />
          <View style={styles.regionRow}>
            <Touchable accessibilityLabel={`지역 ${state.region}, 직접 입력`} onPress={() => go('/my/region')} style={styles.regionField}>
              <IconSlot name="pin" size={16} color="textMuted" />
              <AppText variant="body16Regular" color="textPrimary" style={styles.flex}>
                {state.region}
              </AppText>
            </Touchable>
            <Touchable accessibilityLabel="현재 위치로 찾기" onPress={() => go('/my/location-consent')} style={styles.locate}>
              <IconSlot name="locate" size={16} color="brandDeep" />
              <AppText variant="caption12Bold" color="brandDeep">
                현재 위치
              </AppText>
            </Touchable>
          </View>
          {state.locationConsent ? (
            <Touchable small accessibilityLabel="위치 정보 동의 철회" onPress={onWithdraw} style={styles.withdraw}>
              <AppText variant="caption12Bold" color="textMuted" style={styles.underline}>
                위치 정보 동의 철회
              </AppText>
            </Touchable>
          ) : null}
        </View>
      </FormSection>

      <FormSection title="추천 조건">
        <View style={styles.field}>
          <FieldLabel label="관심 취미" hint="여러 개" />
          <ChipGroup
            options={INTEREST_OPTIONS}
            value={interests}
            onChange={(o) => setInterests((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]))}
          />
        </View>
        <View style={styles.field}>
          <FieldLabel label="꼭 피하고 싶은 조건" hint="여러 개" />
          <ChipGroup
            options={EXCLUDE_OPTIONS}
            value={exclude}
            onChange={(o) => setExclude((cur) => nextSelection(cur, o, 'multi', EXCLUDE_EXCLUSIVE) as string[])}
          />
        </View>
      </FormSection>

      <FormSection title="예산">
        <BudgetSlider {...BUDGET_SLIDERS.month} value={profile.monthBudget} onChange={(monthBudget) => patch({ monthBudget })} />
        <BudgetSlider {...BUDGET_SLIDERS.once} value={profile.onceBudget} onChange={(onceBudget) => patch({ onceBudget })} />
      </FormSection>

      <FormSection title="시간">
        <View style={styles.field}>
          <FieldLabel label="일주일" />
          <ChipGroup options={WEEK_TIME_OPTIONS} value={profile.weekTime} onChange={(weekTime) => patch({ weekTime })} />
        </View>
        <View style={styles.field}>
          <FieldLabel label="1회 시간" />
          <ChipGroup options={ONCE_TIME_OPTIONS} value={profile.onceTime} onChange={(onceTime) => patch({ onceTime })} />
        </View>
      </FormSection>

      <InfoNote text="바꾸면 추천 취미와 활동이 다시 맞춰져요. 월·주 기준은 계획에, 1회 기준은 활동 고르기에 써요." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 24 },
  photo: { alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgForest,
    borderWidth: 3,
    borderColor: COLORS.bgApp,
  },
  field: { gap: 8 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionField: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  locate: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgGreenSoft,
  },
  withdraw: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
});
