'use client';

import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { SchematicFilter } from './components/SchematicFilter';
import styled from 'styled-components';

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? '#0070f3' : 'transparent'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: ${props => props.$active ? '#0070f3' : '#333'};
  }
`;

export default function Home() {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Welcome to Vibe Kanban'));
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{message}</h1>
      
      <TabContainer>
        <TabButton $active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
          Dashboard
        </TabButton>
        <TabButton $active={activeTab === 'filter'} onClick={() => setActiveTab('filter')}>
          Schematic Filtering
        </TabButton>
      </TabContainer>

      {activeTab === 'home' && (
        <div>
          <p>This is a sample page using the new design system.</p>
          <Button>Click me</Button>
        </div>
      )}

      {activeTab === 'filter' && (
        <SchematicFilter />
      )}
    </main>
  );
}
