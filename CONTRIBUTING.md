# Contributing Guide

HobbyTree Frontend 프로젝트의 일관된 협업 방식과 코드 품질 유지를 위한 기여 가이드입니다.

모든 팀원은 아래 규칙을 기준으로 개발을 진행합니다.

---

## 1. Branch Strategy

프로젝트는 다음 브랜치 전략을 사용합니다.

```
main
  ↑
develop
  ↑
feature / fix / refactor / chore / docs / deploy
```

### main
- 발표·배포 가능한 안정적인 코드를 관리합니다.
- develop 브랜치에서 충분히 검증된 변경사항만 병합합니다.
- 직접 Push하지 않고 Pull Request를 통해 병합합니다.

### develop
- 개발 중인 화면과 기능을 통합하는 브랜치입니다.
- 각 작업 브랜치는 develop을 기준으로 생성합니다.
- 직접 Push하지 않고 Pull Request를 통해 병합합니다.

### 작업 브랜치
화면 개발, 버그 수정, 리팩터링 등의 실제 작업을 수행하는 브랜치입니다.

작업을 시작하기 전에 develop 브랜치를 최신 상태로 업데이트합니다.

```bash
git switch develop
git pull origin develop
```

이후 Issue 번호를 포함하여 작업 브랜치를 생성합니다.

```bash
git switch -c feature/15-onboarding-step1
```

---

## 2. Branch Naming Convention

브랜치 이름은 다음 형식을 사용합니다.

```
{type}/{issue-number}-{description}
```

예시:

```
feature/1-login-screen
feature/12-hobby-recommend-list
fix/23-tabbar-icon-color
refactor/31-chip-component
docs/40-readme
chore/41-expo-sdk58
deploy/42-eas-build
```

### Branch Type

| Type | 설명 |
| --- | --- |
| feature | 새로운 화면·기능 개발 |
| fix | 버그 및 오류 수정 |
| refactor | 기능 변경 없는 코드 구조 개선 |
| test | 테스트 코드 작성 및 수정 |
| docs | 문서 작성 및 수정 |
| chore | 설정, 패키지, 빌드 등 기타 작업 |
| deploy | 앱 빌드·배포 관련 작업 (EAS Build 등) |

브랜치 설명은 짧고 명확한 영문 kebab-case를 사용합니다.

---

## 3. Commit Convention

커밋 메시지는 다음 형식을 사용합니다.

```
{type}: {한글 설명}
```

예시:

```
feat: 로그인 화면 구현
fix: 탭 바 아이콘 색상 오류 수정
refactor: 칩 컴포넌트 공통화
test: 온보딩 입력값 검증 테스트 추가
docs: README 실행 방법 수정
chore: Expo SDK 58 업그레이드
deploy: EAS Build 설정 추가
```

### Commit Type

| Type | 설명 |
| --- | --- |
| feat | 새로운 화면·기능 추가 |
| fix | 버그 및 오류 수정 |
| refactor | 기능 변경 없는 코드 리팩터링 |
| test | 테스트 코드 추가 및 수정 |
| docs | 문서 추가 및 수정 |
| chore | 빌드, 설정, 패키지 등 기타 작업 |
| deploy | 배포 관련 작업 |

### Commit 작성 원칙
- 커밋 설명은 한글로 작성합니다.
- 하나의 커밋에는 가능한 하나의 논리적인 변경사항만 포함합니다.
- 변경 내용을 명확하게 파악할 수 있도록 작성합니다.
- 의미 없는 커밋 메시지는 사용하지 않습니다.

```
# Bad

수정
수정2
오류 해결
작업 완료

# Good

feat: 추천 취미 목록 화면 구현
fix: 조건 입력 칩 중복 선택 오류 수정
docs: Figma 링크 추가
```

---

## 4. Issue Convention

작업을 시작하기 전에 작업 유형에 맞는 GitHub Issue를 생성합니다.

| Issue Type | 용도 |
| --- | --- |
| [FEAT] | 새로운 화면·기능 개발 |
| [FIX] | 버그 및 오류 수정 |
| [REFACTOR] | 기능 변경 없는 코드 구조 개선 |
| [CHORE] | 환경 설정, 패키지, 빌드 등 기타 작업 |
| [DOCS] | 문서 작성 및 수정 |
| [DEPLOY] | 배포 관련 작업 |

각 Issue는 Repository에 등록된 Issue Template을 사용하여 작성합니다.

Issue Template에 따라 다음과 같은 내용을 기록합니다.

- 작업 목적 및 개요
- 구체적인 작업 내용
- 관련 자료 (https://www.figma.com/design/0Fs2lOPrxiR5P7cqhkAjIZ/HobbyTree-%ED%95%98%EB%B9%84%ED%8A%B8%EB%A6%AC-v5-%C2%B7-%EC%86%90%EA%B7%B8%EB%A6%BC-%EB%AA%85%EC%84%B8-%EA%B8%B0%EC%A4%80?node-id=0-1&p=f&t=6K5I9Nnfz4jQTQ9w-0
- , API 명세 등)
- 필요한 경우 영향 범위 및 참고사항

생성된 Issue 번호는 작업 브랜치 이름에 포함합니다.

예를 들어 Issue 번호가 #15인 온보딩 1단계 화면을 개발하는 경우:

```
feature/15-onboarding-step1
```

---

## 5. Issue → PR → Merge Workflow

모든 화면 개발 및 주요 변경사항은 다음 흐름을 따릅니다.

```
Issue 생성
    ↓
develop 최신화
    ↓
작업 브랜치 생성
    ↓
개발
    ↓
Commit & Push
    ↓
Pull Request 생성
    ↓
Code Review
    ↓
Approve
    ↓
Merge Commit
    ↓
Issue 자동 Close
    ↓
작업 브랜치 삭제
```

### 1. Issue 생성
작업 유형에 맞는 Issue Template을 사용하여 Issue를 생성합니다.

### 2. develop 최신화
작업을 시작하기 전에 로컬 develop을 최신 상태로 업데이트합니다.

```bash
git switch develop
git pull origin develop
```

`package.json`이 바뀌었다면 패키지를 다시 설치합니다.

```bash
npm install
```

### 3. 작업 브랜치 생성
Issue 번호를 포함하여 새로운 작업 브랜치를 생성합니다.

```bash
git switch -c feature/15-onboarding-step1
```

### 4. 개발 및 Commit
작업 완료 후 변경사항을 확인하고 Commit합니다.

```bash
git add .
git commit -m "feat: 온보딩 1단계 화면 구현"
```

### 5. Push
작업 브랜치를 원격 Repository에 Push합니다.

```bash
git push -u origin feature/15-onboarding-step1
```

### 6. Pull Request 생성
일반적인 개발 작업은 다음 방향으로 Pull Request를 생성합니다.

```
작업 브랜치 → develop
```

릴리즈 시에는 다음 방향으로 Pull Request를 생성합니다.

```
develop → main
```

PR은 Repository의 Pull Request Template을 사용하여 작성합니다.

관련 Issue는 다음 형식으로 연결합니다.

```
Closes #15
```

PR이 Merge되면 연결된 Issue가 자동으로 Close됩니다.

---

## 6. Pull Request Convention

Pull Request에는 최소한 다음 내용을 포함합니다.

- 관련 Issue
- 작업 내용
- 주요 변경 사항
- **화면 스크린샷 또는 녹화** (UI 변경 시 필수, 가능하면 Figma 화면과 나란히)
- 테스트 및 확인 결과 (확인한 기기: iOS / Android, Expo Go 등)
- 리뷰 요청 사항
- PR Checklist

PR 하나에는 가능한 하나의 Issue 또는 하나의 명확한 작업 범위만 포함합니다.

관련 Issue는 다음 형식을 사용합니다.

```
Closes #이슈번호
```

예시:

```
Closes #15
```

공통 컴포넌트, 디자인 토큰(색상·글꼴), 라우팅 구조, API 호출 방식처럼 다른 화면에 영향을 주는 변경사항은 PR에 명확하게 작성합니다.

---

## 7. Merge Convention

프로젝트의 기본 병합 방식은 Merge Commit을 사용합니다.

```
Create a merge commit
```

다음 방식은 기본적으로 사용하지 않습니다.

```
Squash and merge
Rebase and merge
```

Merge Commit을 사용하여 작업 브랜치 단위의 개발 이력을 유지합니다.

### Merge 원칙
- 직접 main, develop에 Push하지 않습니다.
- 모든 변경사항은 Pull Request를 통해 병합합니다.
- 최소 1명의 팀원에게 Code Review 및 Approve를 받은 후 병합합니다.
- 리뷰 중 수정 요청이 있는 경우 수정 후 다시 리뷰를 요청합니다.
- 필요한 CI 검사가 모두 통과한 상태에서 병합합니다.
- Merge가 완료된 작업 브랜치는 삭제합니다.

GitHub Ruleset을 통해 main, develop 브랜치의 Pull Request 및 승인 규칙을 강제합니다.

---

## 8. Code Review Convention

Code Review는 오류를 발견하고 팀의 코드 품질과 구현 방식을 일관되게 유지하는 것을 목적으로 합니다.

리뷰어는 다음 내용을 중심으로 확인합니다.

### 기능
- Figma 디자인과 요구사항에 맞게 구현되었는가?
- 버튼, 칩, 화면 이동 등 사용자 동작이 의도대로 작동하는가?
- 로딩, 에러, 빈 화면(데이터 없음) 상태를 고려했는가?
- 요구사항에 없는 불필요한 기능이 추가되지 않았는가?

### 구조
- 화면(`src/app`)과 재사용 컴포넌트(`src/components`)의 역할이 적절하게 분리되어 있는가?
- 기존 프로젝트 구조와 일관성이 있는가?
- 이미 있는 공통 컴포넌트를 두고 비슷한 컴포넌트를 새로 만들지 않았는가?
- 한 화면·컴포넌트가 지나치게 많은 역할을 가지고 있지 않은가?

### 디자인
- 색상, 글꼴, 여백에 공통 토큰을 사용했는가? (값을 화면에 직접 쓰지 않았는가?)
- iOS와 Android, 작은 화면과 큰 화면에서 모두 깨지지 않는가?
- 터치 영역이 충분한가? (최소 44pt)
- 버튼·아이콘에 접근성 라벨(`accessibilityLabel`)이 있는가?

### 데이터·API
- API 요청·응답 형식이 Backend Swagger 명세와 일치하는가?
- API 호출을 화면에 직접 쓰지 않고 공통 API 클라이언트를 사용하는가?
- 토큰 등 민감한 값을 안전하게 저장하는가?

### 공통 코드
- 기존 공통 컴포넌트와 유틸 함수를 사용하고 있는가?
- 이미 존재하는 공통 기능을 중복 구현하지 않았는가?
- 공통 컴포넌트나 디자인 토큰 변경이 필요한 경우 팀원과 충분히 논의했는가?

### 리뷰 의견
리뷰 의견은 가능한 한 문제점과 이유를 함께 작성합니다.

```
# Bad

이렇게 하면 안 될 것 같습니다.

# Good

버튼 색을 #17AD53으로 직접 쓰고 있어서 테마가 바뀌면 이 화면만 남을 것 같습니다.
theme의 brand.primary 토큰을 사용하는 것이 좋을 것 같습니다.
```

단순한 질문이나 반드시 수정할 필요가 없는 제안은 해당 의도가 드러나도록 작성합니다.

---

## 9. Code Style

TypeScript 타입 검사를 통과한 코드만 병합합니다.

### 타입 검사
작업 완료 후 PR을 생성하기 전에 다음 명령어로 타입 오류를 검사합니다.

```bash
npm run typecheck
```

오류가 있는 경우 수정 후 다시 실행합니다.

### 실행 확인
PR을 생성하기 전에 캐시를 지우고 앱이 정상적으로 실행되는지 확인합니다.

```bash
npx expo start -c
```

### 패키지 설치
새 패키지는 `npm install` 대신 다음 명령어로 설치합니다.
Expo SDK 버전에 맞는 버전이 자동으로 설치됩니다.

```bash
npx expo install <패키지 이름>
```

### Code Style 원칙
- 화면은 `src/app`, 재사용 컴포넌트는 `src/components`에 둡니다.
- 색상, 글꼴, 여백은 공통 토큰을 사용하고 값을 직접 쓰지 않습니다.
- 컴포넌트 이름은 PascalCase(`HobbyCard`), 함수·변수는 camelCase(`selectedHobby`)를 사용합니다.
- 사용하지 않는 import와 `console.log`를 남기지 않습니다.
- `any` 타입 사용을 지양합니다.
- 의미를 파악하기 어려운 축약어 사용을 지양합니다.
- 컴포넌트가 지나치게 커지면 작은 컴포넌트로 나눕니다.

---

## 10. Pull Request 전 Checklist

PR 생성 전 다음 사항을 확인합니다.

- [ ] 최신 develop을 기준으로 작업했는가?
- [ ] 작업 브랜치 이름에 Issue 번호가 포함되어 있는가?
- [ ] Issue 범위에 해당하는 작업만 포함되어 있는가?
- [ ] `npm run typecheck`를 통과하는가?
- [ ] `npx expo start -c`로 앱이 정상 실행되는가?
- [ ] Expo Go(실기기)에서 화면을 직접 확인했는가?
- [ ] Figma 디자인과 화면이 일치하는가? (UI 변경 시 스크린샷 첨부)
- [ ] API 연동 시 Swagger 명세와 요청·응답 형식이 일치하는가?
- [ ] 공통 컴포넌트, 디자인 토큰, 프로젝트 구조를 준수했는가?
- [ ] 불필요한 `console.log`, 테스트 코드 또는 주석이 남아 있지 않은가?
- [ ] 비밀번호, API Key 등의 민감정보가 포함되지 않았는가?
- [ ] 관련 Issue를 `Closes #이슈번호` 형식으로 연결했는가?
- [ ] 새로운 패키지를 추가한 경우 `npx expo install`로 설치하고 필요성을 공유했는가?

---

## 11. 기본 협업 원칙

- Figma 디자인과 API 명세(Swagger)를 기준으로 구현합니다.
- 공통 컴포넌트, 디자인 토큰, 라우팅 구조를 변경해야 하는 경우 팀원과 먼저 논의합니다.
- 새로운 라이브러리나 패키지를 추가할 경우 필요성을 공유합니다.
- 다른 화면에 영향을 줄 수 있는 변경사항은 PR에 명확하게 작성합니다.
- 로그인·인증 방식, API 호출 구조, Expo SDK 버전 변경처럼 프로젝트 전반에 영향을 주는 변경은 단독으로 결정하지 않습니다.
- Repository의 Issue 및 Pull Request Template을 사용합니다.
- main, develop 브랜치에 직접 Push하지 않습니다.
- GitHub Ruleset 및 CI 검사 결과를 준수합니다.
