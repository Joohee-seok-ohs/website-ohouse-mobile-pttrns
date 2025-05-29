import { useEffect, useState, useCallback } from 'react';
import { Global } from '@emotion/react';
import { globalStyles } from './styles/global';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ScreenList from './components/ScreenList';
import { fetchFramesMetadata, getAllTags } from './api/figma';
import styled from '@emotion/styled';

function App() {
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tags, setTags] = useState<{ screenType: string[]; uiComponents: string[] }>({ screenType: [], uiComponents: [] });
  const [selectedScreenTypes, setSelectedScreenTypes] = useState<string[]>([]);
  const [selectedUIComponents, setSelectedUIComponents] = useState<string[]>([]);

  const loadScreens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFramesMetadata();
      setScreens(data);
      setTags(getAllTags(data));
    } catch (err) {
      console.error('Figma 연동 에러:', err);
      setError('화면 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreens();
  }, [loadScreens, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // 필터링된 screens
  const filteredScreens = screens.filter(screen => {
    const matchScreen = selectedScreenTypes.length === 0 || (screen.screenType || []).some((t: string) => selectedScreenTypes.includes(t));
    const matchUI = selectedUIComponents.length === 0 || (screen.uiComponents || []).some((t: string) => selectedUIComponents.includes(t));
    return matchScreen && matchUI;
  });

  return (
    <>
      <Global styles={globalStyles} />
      <Header />
      {error ? (
        <ErrorWrap>
          <div className="error-message">{error}</div>
          <button onClick={handleRetry} className="retry-button">
            다시 시도
          </button>
        </ErrorWrap>
      ) : loading ? (
        <SpinnerWrap>
          <div className="spinner">
            <div className="loader" />
            <div>화면 목록을 불러오는 중입니다...</div>
          </div>
        </SpinnerWrap>
      ) : (
        <>
          <FilterBar
            total={filteredScreens.length}
            tags={tags}
            selectedScreenTypes={selectedScreenTypes}
            selectedUIComponents={selectedUIComponents}
            onChangeScreenTypes={setSelectedScreenTypes}
            onChangeUIComponents={setSelectedUIComponents}
          />
          <ScreenList screens={filteredScreens} />
        </>
      )}
    </>
  );
}

const SpinnerWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  .spinner {
    text-align: center;
    color: #666;
    font-size: 15px;
    padding: 60px 0 20px 0;
  }
  .loader {
    display: inline-block;
    width: 32px;
    height: 32px;
    border: 4px solid #e5e5e5;
    border-top: 4px solid #888;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 20px;

  .error-message {
    color: #666;
    font-size: 15px;
    margin-bottom: 16px;
  }

  .retry-button {
    padding: 8px 16px;
    background: #222;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #444;
    }
  }
`;

export default App; 