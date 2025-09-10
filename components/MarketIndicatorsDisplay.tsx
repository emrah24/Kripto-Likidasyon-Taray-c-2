import React from 'react';
import type { MarketIndicators } from '../types';
import { Loader } from './Loader';

// --- Start of Gauge Implementation ---

const getFearAndGreedColor = (value: number): { text: string; segment: string } => {
    if (value <= 25) return { text: 'text-red-400', segment: '#ef4444' }; // red-500
    if (value <= 45) return { text: 'text-orange-400', segment: '#f97316' }; // orange-500
    if (value <= 55) return { text: 'text-yellow-400', segment: '#eab308' }; // yellow-500
    if (value <= 75) return { text: 'text-lime-400', segment: '#84cc16' }; // lime-500
    return { text: 'text-green-400', segment: '#22c55e' }; // green-500
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
    return d;
};

const FearAndGreedGauge: React.FC<{ value: number, classification: string }> = ({ value, classification }) => {
    const color = getFearAndGreedColor(value);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-full max-w-[200px]">
                <svg viewBox="0 0 100 55">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#ef4444" />
                           <stop offset="25%" stopColor="#f97316" />
                           <stop offset="45%" stopColor="#eab308" />
                           <stop offset="55%" stopColor="#84cc16" />
                           <stop offset="75%" stopColor="#22c55e" />
                           <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                    </defs>
                    <path
                        d={describeArc(50, 50, 40, 0, 180)}
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'translateY(-12px)' }}>
                     <div 
                        className={`text-5xl font-black ${color.text}`}
                        style={{ textShadow: `0 0 10px ${color.segment}60` }}
                    >
                        {value}
                    </div>
                    <div className="text-base font-semibold text-gray-400 -mt-1">{classification}</div>
                    <div className="mt-3" style={{
                        width: '16px',
                        height: '8px',
                        backgroundColor: 'white',
                        clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)'
                    }}/>
                </div>
            </div>
        </div>
    );
};
// --- End of Gauge Implementation ---


interface MarketIndicatorsDisplayProps {
    indicators: MarketIndicators | null;
    isLoading: boolean;
}

const formatMarketCap = (cap: number): string => {
    if (cap >= 1_000_000_000_000) {
        return `${(cap / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (cap >= 1_000_000_000) {
        return `${(cap / 1_000_000_000).toFixed(2)}B`;
    }
    return cap.toLocaleString();
};

const StatCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`relative flex flex-col p-4 bg-[#161b22] rounded-lg border border-gray-800 text-center min-h-[170px] ${className}`}>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">{title}</h4>
        <div className="mt-2 flex-grow flex flex-col items-center justify-center">
            {children}
        </div>
    </div>
);


export const MarketIndicatorsDisplay: React.FC<MarketIndicatorsDisplayProps> = ({ indicators, isLoading }) => {

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-1 p-4 bg-[#161b22] rounded-lg border border-gray-800 text-center min-h-[170px] flex items-center justify-center">
                        <Loader className="w-6 h-6 text-cyan-500" />
                    </div>
                ))}
            </div>
        )
    }

    if (!indicators) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-1 p-4 bg-[#161b22] rounded-lg border border-gray-800 text-center min-h-[170px] flex items-center justify-center">
                        <span className="text-gray-600 text-sm">-</span>
                    </div>
                ))}
            </div>
        );
    }
    
    const { btcDominance, totalMarketCap, fearAndGreedIndex } = indicators;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard title="BTC Dominansı">
                 <div className="text-4xl font-black text-gray-200">
                    {btcDominance.toFixed(2)}%
                </div>
            </StatCard>
            <StatCard title="Toplam Piyasa Değeri">
                 <div className="text-4xl font-black text-gray-200">
                    ${formatMarketCap(totalMarketCap)}
                </div>
            </StatCard>
            <StatCard title="Korku & Açgözlülük Endeksi">
                <FearAndGreedGauge value={fearAndGreedIndex.value} classification={fearAndGreedIndex.classification} />
            </StatCard>
        </div>
    );
};