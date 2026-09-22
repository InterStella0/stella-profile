import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ContentProvider } from './data/ContentContext.jsx';
import './styles/global.css';
import './styles/portfolio.css';
import './styles/book.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>
);
