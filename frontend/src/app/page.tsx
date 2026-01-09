'use client';

import { useEffect, useState } from 'react';
import { Button } from '../components/Button';

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{message}</h1>
      <p>This is a sample page using the new design system.</p>
      <Button>Click me</Button>
    </main>
  );
}
