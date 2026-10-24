# 🌳 HobbyTree Frontend

취미를 시작하고 지속하게 돕는 개인 맞춤형 취미 온보딩 성장 플랫폼

HobbyTree는 사용자의 취향과 생활 조건에 맞는 취미와 작은 첫 체험을 제안하고,
실제 활동에서 얻은 만족도와 체감 난이도를 바탕으로 다음 활동을 조정하는 서비스입니다.

단순히 취미를 추천하는 것에서 끝나지 않고,

**취미 탐색 → 첫 체험 → 활동 기록 → 피드백 → 다음 활동**

으로 이어지는 경험을 제공하는 것을 목표로 합니다.

---

## 📌 Project Overview

| 항목 | 내용 |
| --- | --- |
| 프로젝트명 | HobbyTree |
| 팀명 | 버그 프리 |
| 프로젝트 주제 | 개인 맞춤형 취미 온보딩 성장 플랫폼 |
| 플랫폼 | Mobile Application (iOS / Android) |
| 개발 기간 | 11주 (개발 8주 + 파일럿 3주) |
| Frontend | React Native, Expo (SDK 58), TypeScript |
| Routing | Expo Router (파일 기반 라우팅) |
| Design | Figma |

---

## 🎯 Background

취미를 시작하려는 사용자는 다음과 같은 어려움을 겪을 수 있습니다.

- 자신의 조건에 맞는 취미를 선택하기 어려움
- 취미를 시작해도 다음에 무엇을 해야 할지 알기 어려움
- 취미 활동을 꾸준히 이어가기 어려움
- 함께 활동하고 싶을 때 적절한 동반자를 찾기 어려움

HobbyTree는 사용자의 예산, 시간, 선호 조건 등을 고려해 시작하기 쉬운 활동을 제안하고, 활동 이후의 기록과 피드백을 활용하여 취미를 지속할 수 있도록 돕습니다.

---

## ✨ Core Features

### 🎯 개인 맞춤형 취미 추천
사용자의 취향과 생활 조건을 기반으로 적합한 취미와 활동을 추천합니다.

- 예산
- 사용 가능한 시간
- 준비 조건
- 활동 선호

### 🌱 작은 첫 체험
취미를 처음부터 크게 시작하는 대신 부담 없이 시도할 수 있는 작은 활동을 제공합니다.

- 준비물
- 예상 시간
- 예상 비용
- 추천 이유

### 📝 활동 기록 및 피드백
첫 체험 이후 사용자의 경험을 기록합니다.

- 만족도
- 체감 난이도
- 활동 결과

기록된 피드백을 기반으로 이후 활동의 난이도와 방식을 조정합니다.

### 🔄 취미 전환
현재 취미가 맞지 않는 경우 다른 취미를 다시 탐색할 수 있습니다.

```
취미 추천
   ↓
첫 체험
   ↓
활동 기록
   ↓
피드백
   ↓
다음 활동
   ↓
지속 또는 다른 취미 탐색
```

### 👥 동반자 연결
함께하는 활동이 필요한 경우 사용자가 선택적으로 동반자 연결 기능을 사용할 수 있습니다.

동반자 연결은 HobbyTree의 핵심 기능을 이용하기 위한 필수 조건이 아닌 보조 기능입니다.

MVP에서는 취미 추천, 첫 체험, 기록 및 취미 전환 흐름을 우선적으로 구현합니다.

---

## 🛠 Tech Stack

### Frontend
- React Native 0.88
- Expo SDK 58
- React 19
- TypeScript
- Expo Router

### UI / Device
- Noto Sans KR (`@expo-google-fonts/noto-sans-kr`)
- expo-linear-gradient, expo-blur
- @react-native-community/slider
- expo-image-picker (프로필 사진)
- expo-location (활동 지역 설정)
- expo-clipboard, expo-web-browser

### Design / Collaboration
- Figma (화면 설계 및 컴포넌트)
- GitHub

---

## 🏗 System Architecture

```
Mobile App (React Native · Expo)
        ↓  HTTPS
Nginx (TLS, API 진입점)
        ↓
Spring Boot Backend  ⇄  FastAPI AI 추천 서비스
        ↓
PostgreSQL · AWS S3
```

Frontend는 사용자에게 보이는 화면과 입력·선택 흐름을 담당하며, Backend API를 호출해 추천 결과, 활동 카드, 기록 데이터를 화면에 표시합니다.

---

## 📂 Frontend Responsibilities

Frontend에서는 다음 기능을 담당합니다.

- 로그인 및 온보딩(취향·생활 조건 입력)
- 추천 취미 목록과 추천 이유 표시
- 첫 체험 상세(준비물·예상 시간·비용) 안내
- 활동 기록, 쉬기, 다음 활동 선택
- "취미를 바꾸고 싶어요" 재탐색 흐름
- 취미별 성장을 나무로 표현하는 홈 화면
- 동반자 연결·클래스 예약·채팅 화면 (선택 기능)
- 마이페이지(프로필, 활동 지역, 약관)
- 공통 UI 컴포넌트 및 디자인 토큰 관리
- Backend API 연동

---

## 📁 Project Structure

```
src/
├─ app/                  # Expo Router 화면 (파일 경로 = 화면 주소)
│  ├─ (tabs)/            # 하단 탭: 홈 · 체험 · 함께 · 마이
│  ├─ onboarding/        # 로그인, 조건 입력, 추천 결과
│  ├─ experience/        # 체험 탐색, 상세, 진행 단계
│  ├─ home/              # 나의 나무, 활동 기록, 성장, 알림
│  ├─ together/          # 동반자 연결, 클래스 예약, 채팅
│  ├─ chat/              # 챗봇 대화
│  ├─ my/                # 프로필, 지역, 약관
│  └─ overlay/           # 공유, 신고, 더보기 시트
└─ components/           # 공통 컴포넌트 (Button, Chip, Tag, TopBar, TabBar 등)
   ├─ onboarding/
   ├─ home/
   ├─ activity/
   ├─ chat/
   └─ my/
```

---

## 👥 Team

| 이름 | 역할 |
| --- | --- |
| 김현진 | Team Leader / AI |
| 김우빈 | PM / Backend |
| 윤여빈 | Backend |
| 이승준 | AI |
| 송우정 | Frontend |
| 김민수 | Frontend |

---

## 🌿 Branch Strategy

```
main
  ↑
develop
  ↑
feature / fix / refactor / chore / docs / deploy
```

작업 브랜치는 다음 형식을 사용합니다.

```
{type}/{issue-number}-{description}
```

예시:

```
feature/15-onboarding-step1
fix/23-tabbar-icon
chore/31-expo-sdk58
```

자세한 협업 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.

---

## 🔀 Development Workflow

```
Issue
  ↓
Branch
  ↓
Development
  ↓
Pull Request
  ↓
Typecheck
  ↓
Code Review
  ↓
Approve
  ↓
Merge Commit
  ↓
develop
```

- main, develop 직접 Push 금지
- Pull Request를 통한 코드 병합
- 최소 1명의 Approve 필요
- Typecheck(`npm run typecheck`) 통과 필수
- Merge Commit 방식 사용

---

## 📖 API Documentation

Backend 서버 실행 후 Swagger UI에서 API 명세를 확인할 수 있습니다.

```
http://localhost:8080/swagger-ui/index.html
```

Frontend의 API 호출 형식은 Swagger 명세를 기준으로 맞춥니다.

---

## 🚀 Getting Started

### Requirements
- Node.js (LTS)
- npm
- Git
- 스마트폰에 **Expo Go** 앱 (SDK 58 지원 버전)

### 1. Repository Clone
```bash
git clone <repository-url>
cd hobbytree
```

### 2. 패키지 설치
```bash
npm install
```

### 3. Run
```bash
npx expo start -c
```

- 터미널에 나온 QR 코드를 Expo Go로 스캔합니다. (iPhone은 기본 카메라 앱)
- PC와 휴대폰이 같은 Wi-Fi에 있어야 합니다.
- 다른 네트워크에서 연결할 때는 `npx expo start --tunnel`을 사용합니다.

### 4. 기타 실행
```bash
npm run web       # 브라우저에서 실행
npm run android   # Android 에뮬레이터 (Android Studio 필요)
```

> Windows PowerShell에서 `npx` 실행이 막히면 터미널을 Command Prompt로 바꾸거나
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`를 실행합니다.

---

## 🧹 Code Style

PR 생성 전 TypeScript 타입 검사를 실행합니다.

```bash
npm run typecheck
```

- 화면은 `src/app`, 재사용 컴포넌트는 `src/components`에 둡니다.
- 색상·글꼴은 공통 토큰을 사용하고, 화면에 값을 직접 쓰지 않습니다.
- 새 패키지는 `npm install` 대신 `npx expo install <패키지>`로 설치합니다. (SDK 버전에 맞는 버전이 설치됩니다)

---

## 📄 Documentation

프로젝트의 상세 협업 규칙은 다음 문서를 참고해주세요.

- [Contributing Guide](./CONTRIBUTING.md)
- [Figma 디자인](https://www.figma.com/design/0Fs2lOPrxiR5P7cqhkAjIZ/HobbyTree-%ED%95%98%EB%B9%84%ED%8A%B8%EB%A6%AC-v5-%C2%B7-%EC%86%90%EA%B7%B8%EB%A6%BC-%EB%AA%85%EC%84%B8-%EA%B8%B0%EC%A4%80?node-id=0-1&p=f&t=6K5I9Nnfz4jQTQ9w-0)

---

## 📄 License

본 프로젝트의 라이선스는 [LICENSE](./LICENSE)를 참고해주세요.
