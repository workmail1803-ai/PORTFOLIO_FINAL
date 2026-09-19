import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/600.css';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/500.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/room.css';
import './styles/characters.css';
import './styles/pages.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
