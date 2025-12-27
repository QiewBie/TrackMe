import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n';
import { BUILD_ID, BUILD_TIMESTAMP } from './version';

console.log(`%c Deep Flow Build: ${BUILD_ID}`, 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');
console.log(`Build Time: ${BUILD_TIMESTAMP}`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
