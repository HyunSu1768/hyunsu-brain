'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <main>
      <h1>{message}</h1>
    </main>
  );
}
