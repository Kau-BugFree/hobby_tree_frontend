@echo off
chcp 65001 >nul
setlocal
rem ============================================================
rem  hobbytree4 -> github.com/Kau-BugFree/hobby_tree_frontend
rem  - 키(.env.local), node_modules, android, 로그 파일은 올리지 않음
rem  - 저장소가 비어 있으면 main, 이미 코드가 있으면 새 브랜치 feature/fe-hobbytree4 로 올림
rem ============================================================
set SRC=C:\Users\zzz54\hobbytree4
set DST=C:\Users\zzz54\hobby_tree_frontend
set REPO=https://github.com/Kau-BugFree/hobby_tree_frontend.git
set BRANCH=feature/fe-hobbytree4

where git >nul 2>nul || (echo [오류] Git이 설치돼 있지 않아요. winget install Git.Git 후 다시 실행하세요. & pause & exit /b 1)

if not exist "%DST%\.git" (
  echo [1/5] 팀 저장소 받는 중...
  git clone %REPO% "%DST%" || (echo [오류] clone 실패 - 저장소 권한/로그인을 확인하세요. & pause & exit /b 1)
) else (
  echo [1/5] 이미 받아 둔 저장소가 있어요: %DST%
  git -C "%DST%" fetch origin
)

echo [2/5] hobbytree4 파일 복사 중 (키·빌드 폴더 제외)...
robocopy "%SRC%" "%DST%" /E /XD node_modules android ios .expo .git dist web-build /XF .env.local .env *.log upload-to-github.bat /NFL /NDL /NJH /NJS /NP >nul

cd /d "%DST%"
git add -A

echo [3/5] 올라갈 파일에 비밀 파일이 있는지 확인 중...
git diff --cached --name-only | findstr /I /R "\.env\.local$ \.keystore$ \.jks$ \.p12$" && (
  echo [중단] 비밀 파일이 포함돼 있어요. 위 목록을 확인하세요.
  pause & exit /b 1
)

rem 원격에 브랜치가 하나라도 있으면 기존 코드가 있는 것
for /f %%i in ('git ls-remote --heads origin ^| find /c "refs/heads"') do set HEADS=%%i

if "%HEADS%"=="0" (
  echo [4/5] 빈 저장소 - main 으로 올려요.
  git checkout -B main
  git commit -m "HobbyTree 앱 FE 첫 업로드 (로그인·온보딩·추천·하비코치)" || echo 바뀐 파일이 없어요.
  echo [5/5] push...
  git push -u origin main
) else (
  echo [4/5] 기존 코드가 있어요 - 새 브랜치 %BRANCH% 로 올려요 (main은 건드리지 않음).
  git checkout -B %BRANCH%
  git commit -m "로그인·온보딩(14문항 설문)·추천·하비코치 연동" || echo 바뀐 파일이 없어요.
  echo [5/5] push...
  git push -u origin %BRANCH%
  echo.
  echo GitHub 저장소 페이지에서 "Compare ^& pull request" 를 눌러 PR을 만드세요.
)

echo.
echo 끝! 위에 오류가 없으면 올라간 거예요.
pause
