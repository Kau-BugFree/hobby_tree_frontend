// Figma "HobbyTree 하비트리 v5 · 손그림 명세 기준" 컴포넌트 그래픽을 내려받아
// src/assets/figmaSvg.ts 로 만들어요. (원본 SVG는 assets/figma/ 에도 저장)
//
// Figma에 없어서 직접 그린 SVG는 assets/figma-custom/ 에 두면 같은 이름(파일명)으로 함께 들어가요.
//
// 실행: 프로젝트 폴더(hobbytree)에서  node scripts/download-figma-assets.mjs
// 주의: Figma 임시 주소는 며칠 뒤 만료돼요. 내려받기에 실패하면 assets/figma/ 에 저장해 둔 원본을 대신 써요.
//       그림이 바뀌었으면 Claude에게 새 주소를 요청하세요.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://www.figma.com/api/mcp/asset/';
const assets = {
  // Tree Stage (node 3:90) — 300×240
  'tree-0': '9eec2f0b-65f4-4e6d-99d1-8520d80334eb',
  'tree-1': '52e07db3-5a02-435a-83e9-decab95e60d4',
  'tree-2': 'd6c474dd-d19b-46a3-9875-0aa709f35ce4',
  'tree-3': 'd7ef76a4-9471-4598-bc01-836504731e90',
  'tree-4': 'f1acd2fb-1f26-4dce-9ff7-8c190cb5e768',
  'tree-5': 'c912b950-6ee6-4993-be2b-22e9c3c0d68b',
  // Hobby Icon (node 3:112) — 24×24
  'hobby-커피': 'aae00216-4075-4bd3-91ad-5f3b36abbc29',
  'hobby-러닝': 'b50faf14-ecf6-4462-98d7-a15f354b63d7',
  'hobby-독서': '77d5bccf-ae6d-415d-b390-1edbe3ec32d9',
  'hobby-요리': '85cab02c-5c44-40e4-b735-41da1bd492a4',
  'hobby-악기': 'eeeb5cd0-6ebf-421b-9143-827dd0067b1d',
  // Tab Bar (liquid glass) (node 2:175) — 22×22, 선택(on) / 기본(off)
  'tab-홈-on': '36fac75a-370a-408e-a872-8588230f3510',
  'tab-홈-off': '6b66ec2a-9862-4134-9328-d339119b68e8',
  'tab-체험-on': '69806dc4-efd9-4cbc-b8db-4f3656b7b3f8',
  'tab-체험-off': '876bddce-fb82-4eaf-b044-d0f3a305c98c',
  'tab-함께-on': 'c4da50d0-0c8f-4a0f-9c1e-1cba69ebf4d8',
  'tab-함께-off': '461540c8-8681-42da-a8aa-da44e6f9a203',
  'tab-MY-on': '2829a617-d28c-4d96-a517-55214e098de3',
  'tab-MY-off': 'fd71a8ab-00e1-42ab-a668-2a9dbe22e6f4',
  // Chatbot FAB (node 2:185) — 24×24
  'chat-spark': '5dcfbc29-30f8-4659-8dba-edcd25cf8ca8',
  // T-01 Featured class > Image > illustration (node 1:4286) — 180×108, 클래스 id별 (class-<id>)
  'class-brewing': '0f1a4ae8-9e3c-4936-b1f8-7885d2d8f590/24224.svg',
};
const CUSTOM_DIR = 'assets/figma-custom';

/** react-native-svg가 못 읽는 CSS var(--x, #색) → #색 으로 바꾸고 고정 크기 속성 제거 */
function clean(svg) {
  return svg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/var\(\s*--[\w-]+\s*,\s*([^)]+?)\s*\)/g, '$1')
    .replace(/\s(width|height)="100%"/g, '')
    .replace(/\spreserveAspectRatio="none"/g, '')
    .replace(/\soverflow="visible"/g, '')
    .replace(/\sstyle="display:\s*block;?"/g, '')
    .trim();
}

await mkdir('assets/figma', { recursive: true });
const out = {};
let failed = 0;
for (const [name, id] of Object.entries(assets)) {
  try {
    let res = await fetch(BASE + id);
    let text = await res.text();
    if (!res.ok || !text.includes('<svg')) {
      res = await fetch(BASE + id + '.svg');
      text = await res.text();
    }
    if (!res.ok || !text.includes('<svg')) throw new Error(`HTTP ${res.status}`);
    await writeFile(`assets/figma/${name}.svg`, text);
    out[name] = clean(text);
    console.log(`완료  ${name}`);
  } catch (e) {
    try {
      out[name] = clean(await readFile(`assets/figma/${name}.svg`, 'utf8'));
      console.warn(`보관본  ${name}  (${e.message} — assets/figma/ 원본 사용)`);
    } catch {
      console.error(`실패  ${name}  (${e.message})`);
      failed++;
    }
  }
}

for (const file of (await readdir(CUSTOM_DIR).catch(() => [])).filter((f) => f.endsWith('.svg'))) {
  const name = file.slice(0, -'.svg'.length);
  out[name] = clean(await readFile(`${CUSTOM_DIR}/${file}`, 'utf8'));
  console.log(`직접 제작  ${name}`);
}

const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');
await writeFile(
  'src/assets/figmaSvg.ts',
  `// 자동 생성 파일 — scripts/download-figma-assets.mjs 가 만듭니다. 직접 고치지 마세요.\n` +
    `export const FIGMA_SVG: Record<string, string> = {\n${body}\n};\n`,
);
console.log(failed ? `\n${failed}개 실패 — 주소가 만료됐을 수 있어요.` : '\n모두 받았어요! npx expo start -c 로 다시 실행하세요.');
