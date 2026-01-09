'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledComponentsRegistry>
  );
};
