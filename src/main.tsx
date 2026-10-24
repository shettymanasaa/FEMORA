import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>FEMORA Core Engine & Delivery Platform</h1>
      <p>Person 3 Services (AI Proxy, Medical Content, Reports, Notifications) Loaded.</p>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
