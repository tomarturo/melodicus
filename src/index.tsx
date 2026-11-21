import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { envError } from './lib/env';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html is missing the #root element');

const root = ReactDOM.createRoot(rootElement);

if (envError) {
  // A misconfigured deploy shows what is missing instead of a blank page.
  root.render(
    <pre style={{ padding: '24px', whiteSpace: 'pre-wrap' }}>
      {`Melodicus is missing configuration:\n\n${envError}`}
    </pre>
  );
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
