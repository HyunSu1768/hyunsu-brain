'use client';

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
`;

const CanvasArea = styled.div`
  width: 100%;
  height: 300px;
  background: #1e1e1e;
  border-radius: 8px;
  position: relative;
  cursor: crosshair;
  overflow: hidden;
  border: 1px solid #333;
`;

const Svg = styled.svg`
  width: 100%;
  height: 100%;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ResultCard = styled.div`
  background: #252525;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #444;
`;

const MiniChart = styled.svg`
  width: 100%;
  height: 80px;
  margin-top: 8px;
`;

const normalize = (data: number[]): number[] => {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (max === min) return data.map(() => 0.5);
  return data.map(d => (d - min) / (max - min));
};

export const SchematicFilter = () => {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [interval, setInterval] = useState('1h');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoints = [...points, { x, y }].sort((a, b) => a.x - b.x);
    setPoints(newPoints);
  };

  const clearPoints = () => {
    setPoints([]);
    setResults([]);
    setUserPattern([]);
  };

  const findMatches = async () => {
    if (points.length < 2) return;
    setLoading(true);
    
    const yValues = points.map(p => 300 - p.y); // Invert Y for canvas -> chart

    try {
      const response = await fetch('/api/schematic/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: yValues, interval }),
      });
      const data = await response.json();
      setResults(data.results);
      setUserPattern(data.userPattern);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLine = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return null;
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return <path d={path} fill="none" stroke="#00ff00" strokeWidth="2" />;
  };

  const renderComparisonChart = (prices: number[], pattern: number[]) => {
    if (prices.length < 2) return null;

    const normalizedPrices = normalize(prices);
    
    const pricePath = normalizedPrices.map((price, i) => {
      const x = (i / (normalizedPrices.length - 1)) * 180;
      const y = 80 - price * 80;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const userPath = pattern.map((price, i) => {
        const x = (i / (pattern.length - 1)) * 180;
        const y = 80 - price * 80;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <MiniChart viewBox="0 0 180 80">
        <path d={pricePath} fill="none" stroke="#4dabf7" strokeWidth="1.5" />
        <path d={userPath} fill="none" stroke="#00ff00" strokeWidth="1" strokeDasharray="4 2" />
      </MiniChart>
    );
  };

  return (
    <Container>
      <div>
        <h3>Draw Chart Schematic</h3>
        <p>Click on the area below to draw the expected trend line.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select value={interval} onChange={(e) => setInterval(e.target.value)} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }}>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
        <Button onClick={clearPoints}>Clear</Button>
        <Button onClick={findMatches} disabled={points.length < 2 || loading}>
          {loading ? 'Searching...' : 'Find Matches'}
        </Button>
      </div>

      <CanvasArea ref={containerRef} onClick={handleCanvasClick}>
        <Svg>
          {renderLine(points)}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00ff00" />
          ))}
        </Svg>
        {points.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#666', pointerEvents: 'none' }}>
            Click to draw points
          </div>
        )}
      </CanvasArea>

      {results.length > 0 && (
        <div>
          <h4>Top Matches</h4>
          <ResultGrid>
            {results.map((res, i) => (
              <ResultCard key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{res.symbol}</strong>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>{(res.score * 100).toFixed(1)}%</span>
                </div>
                {renderComparisonChart(res.prices, userPattern)}
              </ResultCard>
            ))}
          </ResultGrid>
        </div>
      )}
    </Container>
  );
};
