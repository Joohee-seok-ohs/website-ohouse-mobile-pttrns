import React from 'react';
import styled from '@emotion/styled';

interface ScreenDetailModalProps {
  open: boolean;
  onClose: () => void;
  screen: {
    id: string;
    screenTitle: string;
    appVersion?: string;
    screenType?: string[];
    uiComponents?: string[];
    thumbnail?: string;
  } | null;
}

const ScreenDetailModal: React.FC<ScreenDetailModalProps> = ({ open, onClose, screen }) => {
  if (!open || !screen) return null;
  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2>{screen.screenTitle}</h2>
        {screen.thumbnail && <img src={screen.thumbnail} alt={screen.screenTitle} style={{ width: '100%', borderRadius: 8 }} />}
        <div>버전: {screen.appVersion || '-'}</div>
        <div>Screen Type: {screen.screenType?.join(', ') || '-'}</div>
        <div>UI Components: {screen.uiComponents?.join(', ') || '-'}</div>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px 24px 24px;
  min-width: 320px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
`;

export default ScreenDetailModal; 