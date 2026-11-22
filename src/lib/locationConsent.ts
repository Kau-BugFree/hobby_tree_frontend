import * as API from '../api/endpoints';
import type { OnboardingOptions } from '../api/types';

/** API-10 locationConsentNotice.version (없으면 다시 받아 온다) */
export async function locationConsentVersion(options: OnboardingOptions | null): Promise<string> {
  const v = options?.locationConsentNotice?.version;
  if (v) return v;
  const fresh = await API.getOnboardingOptions().catch(() => null);
  return fresh?.locationConsentNotice?.version ?? '1.0';
}

/** API-43 위치 동의(true)·철회(false) 기록 */
export async function recordConsent(options: OnboardingOptions | null, agreed: boolean) {
  const version = await locationConsentVersion(options);
  const res = await API.recordLocationConsent({ consentType: 'NEARBY_EXPERIENCES', version, agreed });
  return { ...res, version };
}
