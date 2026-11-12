/**
 * app.json + 소셜 로그인 SDK 설정
 * - 키는 코드에 적지 않고 .env.local 에서 읽는다 (Git에 올라가지 않음)
 *     EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY   카카오 네이티브 앱 키
 *     EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   구글 '웹 애플리케이션' 클라이언트 ID (ID 토큰의 aud — 백엔드 허용 목록과 같아야 함)
 *     EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME  (iOS 빌드할 때만) iOS 클라이언트 ID를 뒤집은 값 com.googleusercontent.apps.xxxx
 * - 플러그인 설정을 바꾼 뒤에는 네이티브 폴더를 다시 만들어야 반영된다: npx expo prebuild --clean
 * - Expo Go에서는 SDK가 동작하지 않는다 → 개발용 빌드(npx expo run:android)에서만 SDK 로그인
 */
const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Windows 빌드: 경로 260자 제한 문제
 * SDK 기본 CMake(3.22)의 ninja는 긴 경로를 못 다뤄서 'Filename longer than 260 characters'로 실패한다.
 * → 긴 경로를 지원하는 새 CMake를 쓰도록 android/app/build.gradle 에 버전을 넣는다 (prebuild --clean 해도 유지)
 *   Android Studio → SDK Manager → SDK Tools → CMake 에서 같은 버전을 설치해야 한다.
 *   다른 버전을 쓰려면 .env.local 에 ANDROID_CMAKE_VERSION=버전
 */
const CMAKE_VERSION = process.env.ANDROID_CMAKE_VERSION || '3.31.6';
const withCmakeVersion = (cfg) =>
  withAppBuildGradle(cfg, (c) => {
    if (!c.modResults.contents.includes('// hobbytree: cmake version')) {
      c.modResults.contents = c.modResults.contents.replace(
        /android\s*\{/,
        `android {\n    // hobbytree: cmake version\n    externalNativeBuild { cmake { version "${CMAKE_VERSION}" } }`,
      );
    }
    return c;
  });

module.exports = ({ config }) => {
  const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const googleIosScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

  const plugins = [...(config.plugins ?? [])];

  // 카카오 SDK는 카카오 전용 Maven 저장소가 필요하다
  plugins.push([
    'expo-build-properties',
    { android: { extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'] } },
  ]);

  if (kakaoKey) {
    plugins.push(['@react-native-seoul/kakao-login', { kakaoAppKey: kakaoKey }]);
  } else {
    console.warn('[app.config] EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY 가 없어 카카오 SDK 설정을 건너뜁니다 (.env.local 확인)');
  }

  plugins.push(googleIosScheme ? ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosScheme }] : '@react-native-google-signin/google-signin');

  plugins.push('expo-dev-client');

  // 스플래시: 초록 배경 + 베이지 로고 (npx expo install expo-splash-screen 후 적용)
  let hasSplash = false;
  try {
    require.resolve('expo-splash-screen/package.json');
    hasSplash = true;
  } catch {
    console.warn('[app.config] expo-splash-screen 이 없어 스플래시 설정을 건너뜁니다 (npx expo install expo-splash-screen)');
  }
  if (hasSplash) {
    plugins.push([
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: '#0D530E' },
    ]);
  }

  return withCmakeVersion({ ...config, plugins });
};
