"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TrendChartProps {
  data: any[];
  dataKey: string;
  target?: number;
  targetLabel?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export const TrendChart = ({ data, dataKey, target, targetLabel = 'Mål', color = '#CABA9C', valueFormatter }: TrendChartProps) => {
  return (
    <div className="h-56 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#ffffff40" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            domain={['auto', 'auto']}
            stroke="#ffffff40" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={valueFormatter} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#102820', 
              borderColor: '#ffffff10', 
              borderRadius: '12px', 
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#CABA9C', fontWeight: 'bold' }}
            formatter={(value: any) => [valueFormatter ? valueFormatter(value) : value, '']}
            labelStyle={{ color: '#ffffff60', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
          />
          {target !== undefined && (
            <ReferenceLine 
              y={target} 
              stroke="#ffffff30" 
              strokeDasharray="4 4" 
              label={{ position: 'insideBottomLeft', value: `${targetLabel}: ${valueFormatter ? valueFormatter(target) : target}`, fill: '#ffffff50', fontSize: 10, dy: -5 }} 
            />
          )}
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={3} 
            dot={{ fill: '#102820', stroke: color, strokeWidth: 2, r: 4 }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} 
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
