import { css } from '@emotion/react';

export const globalStyles = css`
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    background: #fff;
  }

  ::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }
`; 