import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

import './styles/tokens.css';
import './styles/themes.css';
import './styles/globals.css';
import './styles/visual-polish.css';
import './styles/SexualWellbeingPage.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
