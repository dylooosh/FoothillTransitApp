import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import '@mantine/core/styles.css';
import './index.css';
import { MantineProvider } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <Router basename="/FoothillTransitApp">
        <App />
      </Router>
    </MantineProvider>
  </React.StrictMode>
); 