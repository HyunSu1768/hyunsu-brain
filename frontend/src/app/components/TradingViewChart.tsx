'use client';

import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingViewChartProps {
  data: Kline[];
  userPattern: number[];
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, userPattern }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const userPatternSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Initialize chart
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 300,
        layout: {
            background: { color: '#1e1e1e' },
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: { color: '#2b2b43' },
            horzLines: { color: '#2b2b43' },
        },
        timeScale: {
            borderColor: '#484848',
        },
      });
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
      });
      userPatternSeriesRef.current = chartRef.current.addLineSeries({
          color: '#00ff00',
          lineWidth: 2,
          lineStyle: 2, // Dashed
      });
    }

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current!;
    const userPatternSeries = userPatternSeriesRef.current!;

    // Format data for lightweight-charts
    const chartData = data.map(kline => ({
      time: (kline.openTime / 1000) as UTCTimestamp,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
    }));

    candleSeries.setData(chartData);

    // Scale and set user pattern data
    if (userPattern.length > 0 && chartData.length > 0) {
        const minPrice = Math.min(...chartData.map(d => d.low));
        const maxPrice = Math.max(...chartData.map(d => d.high));
        const priceRange = maxPrice - minPrice;

        const userPatternData = userPattern.map((p, i) => {
            const time = chartData[i]?.time;
            if (!time) return null; // Should not happen if lengths match
            return {
                time: time,
                value: minPrice + p * priceRange,
            };
        }).filter(p => p !== null) as { time: UTCTimestamp, value: number }[];
        
        userPatternSeries.setData(userPatternData);
    }
    
    chart.timeScale().fitContent();

    const handleResize = () => {
        if(chartContainerRef.current) {
            chart.resize(chartContainerRef.current.clientWidth, 300);
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [data, userPattern]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />;
};

export default TradingViewChart;
