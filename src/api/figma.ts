const FIGMA_TOKEN = process.env.REACT_APP_FIGMA_TOKEN || ''; // .env에서 불러옴
const FILE_KEY = 'aBz95vVjLFS6gPUW21cMV3'; // Figma 파일 키

// API 응답 캐시
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 캐시된 API 호출 함수
async function cachedFetch(url: string, options: RequestInit) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[Cache] Using cached response for:', url);
    return cached.data;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API 호출 실패: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export async function fetchFigmaFile() {
  return cachedFetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });
}

// 메타데이터 파싱 유틸
function parseMetadataText(text: string) {
  const getField = (label: string) => {
    const match = text.match(new RegExp(`${label}: (.*)`));
    return match ? match[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  };
  return {
    appVersion: text.match(/App Version: (.*)/)?.[1]?.trim() || '',
    screenType: getField('Screen Type'),
    uiComponents: getField('UI Components'),
    screenId: text.match(/Screen ID: (.*)/)?.[1]?.trim() || '',
  };
}

// 재귀적으로 트리 탐색하여 #metadata-card- 프레임과 그 부모 프레임 추출
function findMetadataCards(node: any, parent: any = null, result: any[] = []) {
  if (node.type === 'FRAME' && node.name.startsWith('#metadata-card-')) {
    result.push({ card: node, parent });
  }
  if (node.children) {
    for (const child of node.children) {
      findMetadataCards(child, node, result);
    }
  }
  return result;
}

// 1. 메타데이터만 반환 (썸네일 X)
export async function fetchFramesMetadata() {
  const fileData = await fetchFigmaFile();
  const PAGE_NAME = '🏞️ 스샷 모음';
  const pages = fileData.document.children;
  const targetPage = pages.find((p: any) => p.name === PAGE_NAME);
  if (!targetPage) return [];
  const cardPairs = findMetadataCards(targetPage);
  const screens: any[] = [];
  const seenIds = new Set();
  for (const { card, parent } of cardPairs) {
    const textNode = (card.children || []).find((n: any) => n.type === 'TEXT');
    if (!textNode || !parent) continue;
    if (parent.type !== 'FRAME' && parent.type !== 'COMPONENT') continue;
    if (parent.removed || parent.visible === false) continue;
    if (seenIds.has(parent.id)) continue;
    seenIds.add(parent.id);
    const text = textNode.characters || '';
    const meta = parseMetadataText(text);
    if (!parent.name || parent.name === '-' || parent.name.trim() === '') continue;
    meta.screenType = (meta.screenType || []).filter((t: string) => t && t !== '-' && t.trim() !== '');
    meta.uiComponents = (meta.uiComponents || []).filter((t: string) => t && t !== '-' && t.trim() !== '');
    screens.push({
      id: parent.id,
      screenTitle: parent.name,
      ...meta,
    });
  }
  return screens;
}

// 모든 태그(중복 없이) 추출
export function getAllTags(screens: any[]) {
  const screenTypeSet = new Set<string>();
  const uiComponentsSet = new Set<string>();
  screens.forEach(screen => {
    (screen.screenType || []).forEach((t: string) => screenTypeSet.add(t));
    (screen.uiComponents || []).forEach((t: string) => uiComponentsSet.add(t));
  });
  return {
    screenType: Array.from(screenTypeSet).filter(Boolean),
    uiComponents: Array.from(uiComponentsSet).filter(Boolean),
  };
}

// 2. 썸네일만 개별 fetch
export async function fetchThumbnail(frameId: string): Promise<string> {
  const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${frameId}&format=png`;
  try {
    const data = await cachedFetch(url, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN },
    });
    return data.images?.[frameId] || '';
  } catch (e) {
    console.error('[Error] 썸네일 fetch 실패:', e);
    return '';
  }
} 