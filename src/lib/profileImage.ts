import type { ImagePickerAsset } from 'expo-image-picker';

import { ApiError } from '../api/client';
import * as API from '../api/endpoints';
import type { ImageContentType } from '../api/types';

/**
 * 프로필 사진 올리기
 *   API-08 업로드 URL 발급 → 받은 uploadUrl에 파일을 직접 PUT (서버를 거치지 않음, 5분 유효)
 *   → API-06 profileImageKey = objectKey 로 프로필에 연결 → 응답의 profileImageUrl을 화면에 쓴다
 * 형식: JPEG·PNG·WebP · 최대 5MB
 */
const MAX_SIZE = 5_242_880;

function contentTypeOf(a: ImagePickerAsset): ImageContentType | null {
  const t = (a.mimeType ?? '').toLowerCase();
  if (t === 'image/jpeg' || t === 'image/jpg') return 'image/jpeg';
  if (t === 'image/png' || t === 'image/webp') return t;
  const ext = (a.fileName ?? a.uri).split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return null;
}

export async function uploadProfileImage(asset: ImagePickerAsset): Promise<string | null> {
  const contentType = contentTypeOf(asset);
  if (!contentType) throw new Error('JPEG·PNG·WebP 사진만 올릴 수 있어요');
  const blob = await (await fetch(asset.uri)).blob();
  const fileSize = asset.fileSize ?? blob.size;
  if (!fileSize || fileSize > MAX_SIZE) throw new Error('5MB 이하 사진만 올릴 수 있어요');

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const fileName = (asset.fileName ?? `profile.${ext}`).slice(0, 100);
  const up = await API.issueProfileImageUploadUrl({ fileName, contentType, fileSize });

  const put = await fetch(up.uploadUrl, {
    method: up.method ?? 'PUT',
    headers: { 'Content-Type': contentType, ...(up.requiredHeaders ?? {}) },
    body: blob,
  });
  if (!put.ok) throw new ApiError(put.status, 'UPLOAD_PUT_FAILED', '사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.');

  const res = await API.updateProfile({ profileImageKey: up.objectKey });
  return res.profileImageUrl ?? null;
}
