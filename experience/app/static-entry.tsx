import React from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import Computer from './xp-desktop';
import SceneExperience from './scene-experience';
const Page = window.location.pathname.startsWith('/xp')
  ? Computer
  : SceneExperience;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
