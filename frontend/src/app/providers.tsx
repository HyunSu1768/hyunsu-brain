'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';
import VibeKanbanProvider from './components/VibeKanbanProvider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={theme}>
      <VibeKanbanProvider />
      {children}
    </ThemeProvider>
  );
};
