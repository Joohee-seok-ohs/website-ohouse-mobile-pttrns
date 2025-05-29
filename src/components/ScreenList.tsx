import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { fetchThumbnail } from '../api/figma';

interface ScreenListProps {
  screens: {
    id: string;
    screenTitle: string;
    // thumbnail?: string; // 이제 prop에서 안 받음
  }[];
}

// 썸네일 캐시 (메모리)
const thumbnailCache = new Map<string, string>();
// 썸네일 캐시 (localStorage)
function getLocalCache(id: string) {
  try {
    return localStorage.getItem(`figma-thumb-${id}`) || '';
  } catch { return ''; }
}
function setLocalCache(id: string, url: string) {
  try {
    localStorage.setItem(`figma-thumb-${id}`, url);
  } catch {}
}

// === 글로벌 썸네일 요청 큐 구현 ===
type ThumbnailTask = {
  id: string;
  onDone: (url: string) => void;
};

const thumbnailQueue: ThumbnailTask[] = [];
let isProcessing = false;
const MAX_CONCURRENT = 8; // 동시 요청 수 상향
let currentConcurrent = 0;
const loadingSet = new Set<string>(); // 로딩 중인 썸네일 id

// batch로 5개씩 처리
const BATCH_SIZE = 5;

async function processThumbnailQueue() {
  if (isProcessing) return;
  isProcessing = true;
  while (thumbnailQueue.length > 0) {
    if (currentConcurrent >= MAX_CONCURRENT) {
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }
    // batch로 5개씩 처리
    const batch = [];
    while (batch.length < BATCH_SIZE && thumbnailQueue.length > 0) {
      const task = thumbnailQueue.shift();
      if (task && !loadingSet.has(task.id)) {
        batch.push(task);
        loadingSet.add(task.id);
      }
    }
    if (batch.length === 0) {
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }
    currentConcurrent++;
    Promise.all(
      batch.map(task => fetchThumbnailWithRetry(task.id, 0)
        .then((url) => {
          task.onDone(url);
        })
        .finally(() => {
          loadingSet.delete(task.id);
        })
      )
    ).finally(() => {
      currentConcurrent--;
    });
    await new Promise((r) => setTimeout(r, 300)); // 각 batch 사이 300ms 딜레이
  }
  isProcessing = false;
}

async function fetchThumbnailWithRetry(id: string, retry: number): Promise<string> {
  // localStorage 캐시 우선
  const local = getLocalCache(id);
  if (local) return local;
  try {
    const url = await fetchThumbnail(id);
    if (url) setLocalCache(id, url);
    return url;
  } catch (e: any) {
    if (e?.message?.includes('429') && retry < 5) {
      await new Promise((r) => setTimeout(r, 3000)); // 3초 후 재시도, 최대 5회
      return fetchThumbnailWithRetry(id, retry + 1);
    }
    return '';
  }
}

function enqueueThumbnailRequest(id: string, onDone: (url: string) => void, priority = false) {
  // 이미 큐에 있거나, 로딩 중이거나, 캐시에 있으면 skip
  if (
    thumbnailQueue.find((t) => t.id === id) ||
    loadingSet.has(id) ||
    thumbnailCache.has(id) ||
    getLocalCache(id)
  ) {
    return;
  }
  const task = { id, onDone };
  if (priority) {
    thumbnailQueue.unshift(task); // 우선순위: 맨 앞에 넣음
  } else {
    thumbnailQueue.push(task);
  }
  processThumbnailQueue();
}
// === 글로벌 썸네일 요청 큐 끝 ===

const ScreenList = ({ screens }: ScreenListProps) => {
  // 각 카드별 썸네일 상태 관리
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [visibleScreens, setVisibleScreens] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer 설정
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const screenId = entry.target.getAttribute('data-screen-id');
          if (screenId) {
            setVisibleScreens((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(screenId);
              } else {
                next.delete(screenId);
              }
              return next;
            });
          }
        });
      },
      {
        rootMargin: '1200px 0px', // 더 미리 큐에 넣기
        threshold: 0.1,
      }
    );

    // 모든 카드에 observer 연결
    const cards = document.querySelectorAll('.screen-card');
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [screens]);

  // 화면에 보이는 썸네일을 항상 우선적으로 큐에 넣음
  useEffect(() => {
    // visibleScreens를 Array로 변환(위에서 아래 순서)
    const visibleArr = Array.from(visibleScreens);
    visibleArr.forEach((screenId) => {
      if (thumbnails[screenId] || thumbnailCache.has(screenId) || getLocalCache(screenId)) return;
      enqueueThumbnailRequest(screenId, (url) => {
        if (url) {
          thumbnailCache.set(screenId, url);
          setThumbnails((prev) => ({ ...prev, [screenId]: url }));
        }
      }, true); // priority: true (맨 앞에 넣음)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleScreens, screens]);

  // 최초 마운트 시 localStorage 캐시 반영
  useEffect(() => {
    const cacheObj: Record<string, string> = {};
    screens.forEach((screen) => {
      const local = getLocalCache(screen.id);
      if (local) {
        thumbnailCache.set(screen.id, local);
        cacheObj[screen.id] = local;
      }
    });
    if (Object.keys(cacheObj).length > 0) {
      setThumbnails((prev) => ({ ...prev, ...cacheObj }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens]);

  return (
    <ResultsContainer>
      {screens.map(screen => {
        const imgSrc = thumbnailCache.get(screen.id) || thumbnails[screen.id] || getLocalCache(screen.id) || '';
        return (
          <Card 
            key={screen.id} 
            className="screen-card"
            data-screen-id={screen.id}
          >
            <ImageWrapper>
              {imgSrc ? (
                <img 
                  src={imgSrc} 
                  alt={screen.screenTitle} 
                  crossOrigin="anonymous"
                  loading="lazy"
                />
              ) : (
                <SkeletonImage />
              )}
            </ImageWrapper>
            <div className="card-title">{screen.screenTitle}</div>
          </Card>
        );
      })}
    </ResultsContainer>
  );
};

const ResultsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  justify-content: start;
  margin-top: 8px;
  margin-bottom: 40px;
  padding-left: 40px;
  padding-right: 40px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  margin-bottom: 12px;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 375 / 812;
  background: #fafafa;
  border-radius: 10px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid #eee;
    border-radius: 10px;
    background: #fafafa;
    transition: box-shadow 0.2s;
  }
  img:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const SkeletonImage = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 10px;

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

export default ScreenList; 