# HobbyTree (Figma v5 → React Native)

Figma 파일 `HobbyTree` › 페이지 **📱 Screens · Flow** › 섹션 **HobbyTree v5 · 화면 흐름**의 화면 프레임 68개를 Expo 앱으로 옮긴 프로젝트입니다.

- Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript (strict)
- 파일 기반 라우팅: expo-router (`src/app`)
- 상태: 메모리 Context(`src/lib/appState.tsx`) + MOCK_DATA(`src/data`) — 서버 연동 전 단계

## 실행

```bash
npm install
npx expo start          # Expo Go 또는 개발 빌드로 열기
npm run typecheck       # tsc --noEmit
```

- 사진 선택·카메라·위치·블러·클립보드는 Expo SDK 기본 모듈이라 Expo Go에서도 동작합니다. 스토어 배포·푸시 알림·소셜 로그인 SDK를 붙일 때는 개발 빌드(`npx expo run:ios` / `eas build`)로 전환하세요.
- 새 패키지는 `npx expo install <pkg>`로 설치해야 SDK 호환 버전이 잡힙니다.
- 앱은 `/onboarding/login`(O-01)에서 시작합니다. 온보딩을 끝내면 홈 탭(H-01)으로 이동합니다.

## 아키텍처 요약

1. **화면 = 라우트**: Figma 프레임 1개당 `src/app` 파일 1개. 같은 레이아웃에 데이터만 다른 프레임(H-07-1~4, H-01-C1~C4, T-02/T-06)은 동적 라우트 하나로 합쳤습니다.
2. **오버레이 = 투명 모달 라우트**: Figma OVERLAY 프레임(시트·확인창)은 `presentation: 'transparentModal'` 라우트입니다. NAVIGATE → `go`(push), SWAP → `swap`(replace), BACK/CLOSE → `back`, 흐름 초기화 → `reset`(`src/lib/nav.ts`).
3. **토큰 → 공통 컴포넌트 → 화면**: Figma 변수는 `src/theme`(COLORS · TYPO · SHADOWS)로 옮겼습니다. 컴포넌트 세트(Button, Chip, Choice, Tag, Top Bar, Tab Bar, Chatbot FAB, Tree Stage, Hobby Icon)는 `src/components`에 있고, 화면은 이것들을 조합합니다.
4. **반복 요소 = 서브 컴포넌트 + MOCK_DATA**: 2번 이상 반복되는 행·카드는 `interface` + 데이터 배열로 만들고, 목록은 `FlatList`를 씁니다.
5. **프로토타입 전용 UI는 실제 OS 기능으로 대체**: 키패드·권한 알림·앨범·카메라·인앱 브라우저·토스트(아래 ‘Figma와 다르게 구현한 부분’ 참고).

```
src/
  app/                  라우트 (Figma 프레임 68개 → 화면 파일 52개 + 레이아웃)
    (tabs)/             홈 · 체험 · 함께 · MY 탭 + 커스텀 탭바
    onboarding/ home/ experience/ together/ my/ chat/ overlay/
  components/           공통 UI (AppText, Touchable, Button, Screen, OverlaySheet …)
    onboarding/ home/ activity/ my/ chat/   화면 묶음별 서브 컴포넌트
  data/                 MOCK_DATA (질문 정의, 나무, 활동 카탈로그 5종, 클래스, 약관 …)
  lib/                  appState · nav · coach(AI) · location · config · summary
  theme/                colors · typography · shadow
```

## 변환 규칙 (프롬프트 기준)

| Figma | React Native |
|---|---|
| `visible:false`, opacity 0, Status Bar, Home Indicator, Status spacer | 제거 (SafeArea 여백으로 대체) |
| fill·stroke·padding 없는 1자식 래퍼 | 평탄화 |
| Auto layout V/H, gap, padding | `flexDirection`, `gap`, `paddingHorizontal/Vertical` |
| FILL / HUG / FIXED | `flex:1`·`alignSelf:'stretch'` / 크기 생략 / 고정값 (360~430 폭은 `'100%'`) |
| 절대 좌표 | 무시 — 떠 있는 요소(FAB, 탭바, 시트, 배지)만 `position:'absolute'` |
| TEXT | `AppText` (Noto Sans KR, lineHeight·letterSpacing, `includeFontPadding:false`, `textAlignVertical:'center'`) |
| Drop shadow | `shadow()` → iOS `shadow*` / Android `elevation` (`Platform.select`) |
| 클릭 요소 | `Touchable`(Pressable, 눌림 opacity 0.7, 44dp 미만은 `hitSlop 8`) |
| VECTOR·아이콘·일러스트 | `IconSlot` / `TreeStage` / `IllustrationSlot` 자리 표시자 (`// TODO: Replace with Icon/SVG (노드명)`) |
| 사진 | `<Image resizeMode="cover" />` |
| TextInput이 있는 화면 | `Screen keyboard` 또는 `KeyboardSafe`(KeyboardAvoidingView) |

## 화면 매핑 (Figma → 라우트)

| 코드 | Figma 노드 | 화면 | 라우트 / 구현 |
|---|---|---|---|
| O-01 | 4:2 | 로그인 | `onboarding/login` |
| O-02 | 4:62 | 온보딩 1/4 · 상태·관심·목적 | `onboarding/step1` |
| O-03 | 4:131 | 온보딩 2/4 · 예산·시간 | `onboarding/step2` |
| O-03-1 | 239:3294 | Q04 직접 금액 입력 (시트) | `onboarding/amount-q04` (오버레이) |
| O-03-2 | 239:3351 | Q05 직접 금액 입력 (시트) | `onboarding/amount-q05` (오버레이) |
| O-03-3 | 243:3369 | Q06 직접 시간 입력 (시트) | `onboarding/time-q06` (오버레이) |
| O-04 | 4:227 | 온보딩 3/4 · 물품·환경 | `onboarding/step3` |
| O-05 | 145:1595 | 온보딩 4/4 · 확인 | `onboarding/step4` |
| O-05-1 | 146:1497 | 선택 설정 · Q11~Q14 | `onboarding/optional` |
| O-05-2 | 5:116 | 정보 종합 · 추천 준비 | `onboarding/summary` |
| O-06 | 5:169 | 추천 취미 목록 · 선택 | `onboarding/recommend` |
| O-06-1 | 146:1637 | 고른 취미 추가 확인 · B01~B06 | `onboarding/confirm` |
| O-07 | 5:267 | 나무 심기 완료 | `onboarding/planted` |
| H-01 | 213:2651 | 홈 · 나무 4그루 | `(tabs)/home` |
| H-01-C1~C4 | 214:2487 · 2502 · 2517 · 2533 | 이어하기 확인 (오버레이) | `home/continue/[hobby]` |
| H-04 | 8:527 | 활동 기록 (시트) | `home/record` (오버레이) |
| H-05 | 8:579 | 성장 · 큰 나무가 됐어요 | `home/growth` |
| H-06 | 8:638 | 세계수 완성 | `home/world-tree` |
| H-07-1~4 | 214:2548 · 2620 · 2692 · 8:702 | 진행 활동 (요리·커피·악기·독서) | `home/activity/[hobby]` |
| H-08 | 149:2652 | 알림 | `home/notifications` |
| H-09 | 215:2624 | 새 나무 심기 | `home/plant` |
| H-10 | 215:2774 | 새 나무 심기 완료 | `home/planted` |
| OV-10 | 214:2764 | 기록 완료 (오버레이) | `home/record-done` |
| E-01 | 42:1330 | 체험 · 나무 단계 카드 | `(tabs)/experience` |
| E-02 | 42:1601 | 세부 활동 목록 | `experience/stage?hobby=&stage=` |
| E-03 | 43:1499 | 활동 세부 설명 · 광고 | `experience/detail?id=` |
| E-03-1 | 11:884 | 광고 상세 | `experience/ad?id=` |
| E-03-2 | 149:2580 | 활동 진행 · 필터 맞추기 | `experience/progress` |
| E-04 | 12:795 | 다른 취미 활동 확인하기 | `experience/explore` |
| T-01 | 12:921 | 함께 · 원데이 클래스 추천 | `(tabs)/together` |
| T-02 / T-06 | 13:885 / 219:2870 | 클래스 상세 / 준비 중 | `together/class/[id]` |
| T-03 | 13:976 | 채팅 준비 중 (시트) | `together/chat-soon` (오버레이) |
| T-03-1 | 219:2995 | 출시 알림 설정 완료 (시트) | `together/chat-alarm-set` (오버레이) |
| T-04 | 218:2708 | 예약하기 | `together/book?id=` |
| T-05 | 218:3311 | 예약 완료 | `together/booked` |
| T-07 | 219:2975 | 아직 준비중이에요 (오버레이) | `together/coming-soon` (오버레이) |
| M-01 | 44:1362 | MY · 프로필 + 취미 로드맵 | `(tabs)/my` |
| M-02 | 44:1578 | 커피 로드맵 상세 | `my/roadmap?hobby=` (5개 취미 공통) |
| M-03 | 14:1228 | 프로필 · 취향 수정 | `my/profile` |
| M-04 | 143:1398 | 위치 정보 수집 동의 (시트) | `my/location-consent` (오버레이) |
| M-05 | 143:1509 | 프로필 사진 변경 (시트) | `my/photo-sheet` (오버레이) |
| M-06 | 221:2961 | 위치기반서비스 이용약관 | `my/terms-location` |
| M-07 | 221:3032 | 개인위치정보 수집·이용 동의 | `my/terms-personal` |
| M-08 | 222:2991 | 지역 직접 입력 | `my/region` |
| M-09 | 222:3140 | 앨범 접근 권한 (iOS 시스템 알림) | OS 권한 알림 (expo-image-picker) |
| M-10 | 222:3153 | 앨범에서 사진 선택 | 시스템 사진 선택기 `launchImageLibraryAsync` |
| M-11 | 222:3354 | 카메라 접근 권한 (iOS 시스템 알림) | OS 권한 알림 `requestCameraPermissionsAsync` |
| M-12 | 222:3365 | 카메라 촬영 | 시스템 카메라 `launchCameraAsync` |
| M-13 | 222:3389 | 기본 이미지 되돌리기 확인 | `my/reset-photo` (오버레이) |
| C-01 | 40:1748 | 챗봇 · 홈 위에 펼친 패널 | `chat/panel` (오버레이) |
| C-02 | 15:1308 | 챗봇 대화 | `chat/conversation?q=` |
| OV-01 | 149:2714 | 더보기 메뉴 (시트) | `overlay/more` |
| OV-02 | 149:2729 | 외부 페이지 이동 안내 | `overlay/external?title=&url=` |
| OV-03 | 223:3166 | 공유하기 (시트) | `overlay/share` |
| OV-04 · 05 · 06 · 11 | 223:3206 · 3214 · 3221 · 3440 | 공유·링크 복사·저장·알림 설정 토스트 | `useToast()` (ToastProvider, 1.8초) |
| OV-07 | 223:3229 | 문제 신고하기 (시트) | `overlay/report` |
| OV-08 | 223:3378 | 신고 접수 완료 | `overlay/report-done` |
| OV-09 | 223:3389 | 외부 페이지 (인앱 브라우저) | `expo-web-browser` (SFSafariViewController / Custom Tabs) |

## Figma와 다르게 구현한 부분

- **시스템 UI는 직접 그리지 않음**: Status Bar·Home Indicator는 SafeArea로, M-09/M-11 권한 알림·M-10 앨범·M-12 카메라·OV-09 브라우저는 OS 화면으로 대체했습니다. 권한 문구는 `app.json` 플러그인 설정에 있습니다.
- **키패드**: O-03-1/2의 숫자 키패드는 시스템 숫자 키보드(`keyboardType="number-pad"`)로 바꿨습니다. O-03-3 시간 휠은 스냅 ScrollView로 구현했습니다.
- **토스트**: OV-04/05/06/11 프레임은 화면이 아니라 `useToast()` 호출입니다. 스크린리더에도 읽어 줍니다.
- **C-01 패널**: 오버레이라서 아래 화면(홈·탭바)은 다시 그리지 않고 지금 보던 화면을 그대로 비춥니다. 빠른 질문으로 들어가면 패널이 대화 화면으로 바뀌어, 뒤로 가면 원래 탭으로 돌아갑니다.
- **M-02 로드맵**: Figma는 커피만 있지만, 활동 카탈로그로 5개 취미 모두 같은 화면을 씁니다. Figma의 ‘완료 2/12’와 목록 표시가 어긋나 있어 완료 기록 기준으로 맞췄습니다.
- **M-03 프로필**: 위치 동의를 한 상태면 ‘위치 정보 동의 철회’ 링크를 보여 줍니다(약관 제9조, M-07 6항). Q09 제외 조건의 ‘직접 입력’은 온보딩에서만 받습니다.
- **M-04 동의**: 필수 동의 2개를 모두 체크해야 버튼이 활성화됩니다. 권한 거부·위치 실패 시 M-08로 넘어갑니다. 좌표는 기기에서 시·구로 바꾼 뒤 저장하지 않습니다.
- **OV-03 공유**: 메시지(sms:)·메일(mailto:)·링크 복사(클립보드)·더보기(시스템 공유 시트)를 실제로 실행합니다. 공유 도메인은 `src/lib/config.ts`의 자리 표시 값입니다.
- **폰트**: 쓰는 굵기 4개(400·500·700·900)만 개별 경로로 불러와 번들 크기를 줄였습니다.

## 아이콘·일러스트

벡터 아이콘과 나무 일러스트는 Figma 원본 크기의 자리 표시자(`IconSlot`, `TreeStage`, `IllustrationSlot`)입니다. 코드에서 `TODO: Replace with Icon/SVG`를 검색하면 교체할 곳이 나옵니다. 권장 방식은 Figma에서 SVG로 내보내고 `react-native-svg` + `react-native-svg-transformer`로 컴포넌트화하는 것입니다. 나무 6단계는 Lottie나 PNG(@2x, @3x)도 괜찮습니다.

## 백엔드·AI 연동 TODO

코드에서 `TODO(API)`, `TODO(AI)`로 검색하세요.

| 영역 | 위치 | 할 일 |
|---|---|---|
| 인증 | `onboarding/login` | 카카오·Apple 로그인 SDK → 서버 토큰 교환, 토큰은 `expo-secure-store` |
| 온보딩 답변 | `lib/appState`, `onboarding/*` | `PUT /me/onboarding` 저장, 단계별 임시 저장 |
| 추천 | `onboarding/summary`, `recommend` | `POST /recommendations` (AI) — 로딩·실패·재시도 상태, 응답 스키마 검증 |
| 자유 입력 해석 | `onboarding/optional` | Q14 문장 → 서버 LLM 구조화 결과로 칩 표시 (지금은 MOCK) |
| 나무·활동 | `data/hobbies`, `data/catalog` | `GET /me/trees`, `GET /hobbies/:key/catalog` — 카탈로그 JSON(약 540KB)은 앱 번들에서 빼고 서버·캐시로 |
| 기록 | `home/record`, `experience/progress` | `POST /activities/:id/records` (오프라인 큐 + 재전송) |
| 클래스·예약 | `data/together`, `together/book` | 좌석 임시 확보 → PG 결제 → 서버 웹훅 검증 후 확정 |
| 광고·외부 링크 | `experience/ad`, `overlay/external` | 서버가 내려준 URL만 열기, 클릭 이벤트 기록 |
| 프로필 | `my/profile`, `my/photo-sheet` | `PATCH /me/profile`, 사진은 presigned URL 업로드 |
| 위치 | `lib/location`, `my/location-consent` | 동의 버전·시각 기록, 시·구만 전송 |
| 하비 코치 | `lib/coach.ts`, `chat/*` | 앱 → 백엔드 → LLM, 스트리밍(SSE), AbortController 취소, 출처·관련 활동 구조화 응답, 안전 필터 |
| 신고·저장·알림 | `overlay/*`, `together/coming-soon` | `POST /reports`, `POST /me/saved`, 푸시 토큰 등록(`expo-notifications`) |

## 확인한 것

- `npx tsc --noEmit` 통과 (`--noUnusedLocals`로 미사용 코드도 확인)
- `npx expo export --platform ios|android` 번들 생성 성공
- 실제 기기와 시뮬레이터에서는 아직 실행해 보지 않았습니다. 화면별 UI 확인이 필요합니다.
