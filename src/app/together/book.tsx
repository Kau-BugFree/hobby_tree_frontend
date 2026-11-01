/**
 * T-04 예약하기
 * - 날짜: 가로 스크롤 카드(DateCard) 단일 선택
 * - 시간·결제 수단: ChoiceGroup / 인원: PeopleStepper(± → 결제 금액 갱신)
 * - 필수 동의 2개(AgreeRow) 모두 체크해야 결제 버튼 활성화
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  ChoiceGroup,
  Divider,
  HobbyIcon,
  IconSlot,
  IconTile,
  Screen,
  SectionTitle,
  TopBar,
  Touchable,
} from '../../components';
import { classById, DATE_SLOTS, DateSlot, MAX_PEOPLE, PAYMENTS, REFUND_RULES, TIME_SLOTS } from '../../data/together';
import { withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

// 시스템 글자 크기를 키워도 날짜 카드가 과하게 커지지 않도록 상한을 둔다
const DATE_FONT_MAX = 1.3;

function DateCard({ slot, selected, onPress }: { slot: DateSlot; selected: boolean; onPress: () => void }) {
  return (
    <Touchable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${slot.date} ${slot.weekday}요일, ${slot.seats}자리`}
      onPress={onPress}
      style={[styles.date, selected ? styles.dateOn : styles.dateOff]}
    >
      <AppText variant="caption12Medium" color={selected ? 'textOnDarkMuted' : 'textMuted'} maxFontSizeMultiplier={DATE_FONT_MAX}>
        {slot.weekday}
      </AppText>
      <AppText variant="body16Bold" color={selected ? 'textOnDark' : 'textPrimary'} numberOfLines={1} maxFontSizeMultiplier={DATE_FONT_MAX}>
        {slot.date}
      </AppText>
      <AppText variant="micro11Bold" color={selected ? 'textOnDark' : 'brandPrimary'} maxFontSizeMultiplier={DATE_FONT_MAX}>
        {`${slot.seats}자리`}
      </AppText>
    </Touchable>
  );
}

function PeopleStepper({ count, price, onChange }: { count: number; price: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperRow}>
        <View>
          <AppText variant="body16Bold" color="textPrimary">
            인원
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            {`1인 ${withComma(price)}원 · 최대 ${MAX_PEOPLE}명`}
          </AppText>
        </View>
        <View style={styles.stepperCtrl}>
          <Touchable
            accessibilityLabel="인원 줄이기"
            disabled={count <= 1}
            onPress={() => onChange(count - 1)}
            style={[styles.minus, count <= 1 && styles.disabled]}
          >
            <IconSlot name="minus" size={18} color={count <= 1 ? 'borderStrong' : 'textPrimary'} />
          </Touchable>
          <AppText variant="headline18Bold" color="textPrimary" align="center" style={styles.count}>
            {`${count}명`}
          </AppText>
          <Touchable
            accessibilityLabel="인원 늘리기"
            disabled={count >= MAX_PEOPLE}
            onPress={() => onChange(count + 1)}
            style={[styles.plus, count >= MAX_PEOPLE && styles.plusOff]}
          >
            <IconSlot name="plus" size={18} color={count >= MAX_PEOPLE ? 'textMuted' : 'textOnDark'} />
          </Touchable>
        </View>
      </View>
      <Divider />
      <View style={styles.stepperRow}>
        <AppText variant="callout14Regular" color="textBody">
          결제 금액
        </AppText>
        <AppText variant="headline18Bold" color="brandDeep">
          {`${withComma(price * count)}원`}
        </AppText>
      </View>
    </View>
  );
}

function AgreeRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Touchable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onToggle} style={styles.agree}>
      <View style={[styles.box, checked ? styles.boxOn : styles.boxOff]}>
        {checked ? <IconSlot name="check" size={14} color="textOnDark" /> : null}
      </View>
      <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
        {label}
      </AppText>
    </Touchable>
  );
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = classById(id);
  const [date, setDate] = useState(DATE_SLOTS[0].id);
  const [time, setTime] = useState<(typeof TIME_SLOTS)[number]>(TIME_SLOTS[1]);
  const [people, setPeople] = useState(1);
  const [pay, setPay] = useState<(typeof PAYMENTS)[number]>(PAYMENTS[0]);
  const [agree, setAgree] = useState({ refund: false, share: false });
  const ready = agree.refund && agree.share;

  // TODO(API): POST /bookings (자리 임시 확보) → PG 결제 → 서버 웹훅 검증 후 확정
  const onPay = () => {
    const slot = DATE_SLOTS.find((d) => d.id === date)!;
    go(
      `/together/booked?id=${c.id}&date=${encodeURIComponent(`${slot.date}(${slot.weekday})`)}&time=${encodeURIComponent(
        time.split(' · ')[0],
      )}&people=${people}&pay=${encodeURIComponent(pay)}`,
    );
  };

  return (
    <Screen
      header={<TopBar title="예약하기" />}
      footer={<Button label="결제하고 예약하기" disabled={!ready} onPress={onPay} />}
      contentStyle={styles.content}
    >
      <View style={styles.summary}>
        <IconTile size={52} radius={16} bg="bgKhaki">
          <HobbyIcon hobby={c.hobby} size={26} />
        </IconTile>
        <View style={styles.flex}>
          <AppText variant="body16Bold" color="textPrimary">
            {c.title}
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            {`${c.host} · ${c.area.split(' · ')[0].replace('동', '')} · ${c.duration} · 1인 ${withComma(c.price)}원`}
          </AppText>
        </View>
      </View>

      <SectionTitle title="날짜" right="옆으로 넘겨 보세요" />
      {/* 화면 좌우 끝까지 이어지는 가로 스크롤 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dates}>
        {DATE_SLOTS.map((s) => (
          <DateCard key={s.id} slot={s} selected={date === s.id} onPress={() => setDate(s.id)} />
        ))}
      </ScrollView>

      <SectionTitle title="시간" />
      <ChoiceGroup options={TIME_SLOTS} value={time} onChange={setTime} />

      <PeopleStepper count={people} price={c.price} onChange={setPeople} />

      <SectionTitle title="결제 수단" />
      <ChoiceGroup options={PAYMENTS} value={pay} onChange={setPay} />

      <SectionTitle title="취소·환불 안내" />
      <View style={styles.refund}>
        {REFUND_RULES.map((r) => (
          <AppText key={r} variant="callout14Regular" color="textBody">
            {`· ${r}`}
          </AppText>
        ))}
        <AppText variant="caption12Medium" color="textMuted">
          {`판매처(${c.host}) 규정을 따라요.`}
        </AppText>
      </View>

      <View>
        <AgreeRow label="[필수] 취소·환불 규정을 확인했어요" checked={agree.refund} onToggle={() => setAgree((a) => ({ ...a, refund: !a.refund }))} />
        <AgreeRow
          label="[필수] 예약자 이름·연락처를 판매처에 제공하는 데 동의해요"
          checked={agree.share}
          onToggle={() => setAgree((a) => ({ ...a, share: !a.share }))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 16 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  dateScroll: { marginHorizontal: -24 },
  dates: { gap: 8, paddingHorizontal: 24 },
  date: {
    minWidth: 62,
    minHeight: 80,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dateOn: { backgroundColor: COLORS.brandPrimary },
  dateOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  stepper: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperCtrl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  minus: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  plus: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandPrimary },
  plusOff: { backgroundColor: COLORS.bgSunken },
  disabled: { opacity: 0.6 },
  count: { minWidth: 36 },
  refund: { gap: 6, padding: 14, borderRadius: 16, backgroundColor: COLORS.bgSunken },
  agree: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: COLORS.brandPrimary },
  boxOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1.5, borderColor: COLORS.borderStrong },
});
