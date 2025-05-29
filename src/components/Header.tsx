import styled from '@emotion/styled';

const Header = () => {
  return (
    <HeaderContainer>
      <div className="header-left">
        <h1>오늘의집 App Screens</h1>
      </div>
      <div className="header-right" style={{ display: 'none' }}>
        {/* 문의/설정 버튼 (숨김 처리) */}
        <button className="button--primary">새로고침</button>
      </div>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 40px 12px;
  background: #fff;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    flex: 1;
    width: 0;
  }

  h1 {
    font-size: 24px;
    margin: 0;
    line-height: 36px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    width: 100%;
  }

  .button--primary {
    background-color: #333;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    
    &:hover {
      background-color: #444;
    }
  }
`;

export default Header; 