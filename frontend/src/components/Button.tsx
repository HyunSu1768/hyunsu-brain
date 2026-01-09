'use client';

import styled from 'styled-components';

export const Button = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.background};
  border: none;
  border-radius: 4px;
  padding: ${(props) => props.theme.spacing[2]} ${(props) => props.theme.spacing[4]};
  font-size: ${(props) => props.theme.fontSizes.md};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => props.theme.colors.secondary};
  }
`;
