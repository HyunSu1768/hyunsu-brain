'use client';

import { createChart, IChartApi, ISeriesApi, UTCTimestamp, CandlestickData, LineData, CandlestickSeries, LineSeries } from 'lightweight-charts';
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
    if (!chartContainerRef.current) return;

    // Initialize chart if it doesn't exist
    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
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
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
      });

      const userPatternSeries = chart.addSeries(LineSeries, {
        color: '#00ff00',
        lineWidth: 2,
        lineStyle: 2, // Dashed
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      userPatternSeriesRef.current = userPatternSeries;
    }

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const userPatternSeries = userPatternSeriesRef.current;

    if (!chart || !candleSeries || !userPatternSeries || data.length === 0) return;

    // Format data for lightweight-charts
    const chartData: CandlestickData[] = data.map(kline => ({
      time: (Math.floor(kline.openTime / 1000)) as UTCTimestamp,
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

      const userPatternData: LineData[] = userPattern.map((p, i) => {
        const time = chartData[i]?.time;
        if (time === undefined) return null;
        return {
          time: time,
          value: minPrice + p * priceRange,
        };
      }).filter((p): p is LineData => p !== null);

      userPatternSeries.setData(userPatternData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 300);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // We don't necessarily want to destroy the chart on every data update
      // but if the component unmounts, we should. 
      // React 18 strict mode might call this cleanup often.
    };
  }, [data, userPattern]);

  // Separate effect for cleanup on unmount only
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '300px' }} />;
};

export default TradingViewChart;
