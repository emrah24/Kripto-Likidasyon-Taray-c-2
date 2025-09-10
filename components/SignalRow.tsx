import React from 'react';
import type { Signal, SignalType, TimeIntervalChanges } from '../types';
import { StarIcon, TradingViewIcon, CoinGlassIcon } from './icons';

interface SignalCardProps {
    signal: Signal;
}

const SignalBadge: React.FC<{ type: SignalType }> = ({ type }) => {
    const isPump = type === 'PUMP';
    const bgColor = isPump ? 'bg-green-500/10' : 'bg-red-500/10';
    const textColor = isPump ? 'text-green-300' : 'text-red-300';
    const dotColor = isPump ? 'bg-green-400' : 'bg-red-400';

    return (
        <div className={`flex-shrink-0 inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full ${bgColor} ${textColor}`}>
            <span className={`w-1.5 h-1.5 mr-2 rounded-full ${dotColor}`}></span>
            {type}
        </div>
    );
};

const LongShortRatioBar: React.FC<{ long: number; short: number }> = ({ long, short }) => {
    return (
        <div className="w-full mt-4">
            <div className="relative h-1.5 w-full bg-red-500/20 rounded-full overflow-hidden">
                <div className="absolute h-full bg-cyan-400 rounded-full" style={{ width: `${long}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                <span className="font-mono">L: {long.toFixed(2)}%</span>
                <span className="font-mono text-red-400">S: {short.toFixed(2)}%</span>
            </div>
        </div>
    );
};

const Stars: React.FC<{ count: number }> = ({ count }) => (
    <div className="flex items-center">
        {[...Array(count)].map((_, i) => (
            <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
        ))}
    </div>
);

const IntervalDataTable: React.FC<{ title: string, data: TimeIntervalChanges }> = ({ title, data }) => (
    <div>
        <h5 className="font-bold text-gray-500 mb-2 text-center text-[11px] uppercase tracking-wider">{title}</h5>
        <div className="flex flex-col gap-1 font-mono text-xs">
            {Object.entries(data).map(([interval, value]) => {
                const valueColor = value >= 0 ? 'text-green-400' : 'text-red-400';
                const prefix = value >= 0 ? '+' : '';
                return (
                    <div key={interval} className="flex justify-between items-center">
                        <span className="text-gray-500">{interval}:</span>
                        <span className={`${valueColor}`}>{prefix}{value.toFixed(2)}%</span>
                    </div>
                );
            })}
        </div>
    </div>
);


export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
    const isPump = signal.signal === 'PUMP';
    const priceChangeColor = isPump ? 'text-green-400' : 'text-red-400';
    const priceChangePrefix = isPump ? '+' : '';
    
    const displayName = signal.symbol.replace('BINANCE:', '').replace('PERP', '');
    const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${signal.symbol}`;
    const coinglassUrl = `https://www.coinglass.com/tv/Binance_${displayName}`;

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-900/20 flex flex-col justify-between h-full">
            <div>
                {/* Top Section */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-cyan-400">{displayName}</span>
                            {signal.significance > 0 && <Stars count={signal.significance} />}
                            <div className="flex items-center gap-2.5 ml-1">
                                <a href={tradingViewUrl} target="_blank" rel="noopener noreferrer" title={`TradingView'de Görüntüle: ${displayName}`}>
                                    <TradingViewIcon className="w-5 h-5 text-yellow-500 hover:text-yellow-400 transition-colors" />
                                </a>
                                <a href={coinglassUrl} target="_blank" rel="noopener noreferrer" title={`CoinGlass'ta Görüntüle: ${displayName}`}>
                                    <CoinGlassIcon className="w-5 h-5 text-slate-400 hover:text-slate-300 transition-colors" />
                                </a>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono tracking-tighter -mt-1">.......................</div>
                    </div>
                    <SignalBadge type={signal.signal} />
                </div>

                {/* Middle Section */}
                <div className="flex justify-between items-center">
                     <div className="font-mono">
                        <div className="text-xl font-semibold text-gray-200">${signal.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 8})}</div>
                        <div className={`text-base font-semibold ${priceChangeColor}`}>{priceChangePrefix}{signal.price_change_pct.toFixed(2)}%</div>
                        <div className="text-xs text-gray-500">${signal.last_vol_usd.toLocaleString()}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Skor</div>
                        <div 
                            className="bg-black/20 p-2 rounded-lg glow" 
                            style={{"--glow-color": "rgba(34, 211, 238, 0.4)"} as React.CSSProperties}
                        >
                           <span className="text-4xl font-black text-cyan-300">{signal.score.toFixed(2)}</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* L/S Ratio Bar */}
            <LongShortRatioBar long={signal.long_short_ratio.long} short={signal.long_short_ratio.short} />

            {/* Detailed Analysis Section */}
            <div className="mt-4 pt-3 border-t border-gray-800/60">
                <div className="grid grid-cols-2 gap-x-4">
                    <IntervalDataTable title="OI Değişimi" data={signal.oi_change} />
                    <IntervalDataTable title="Fiyat Değişimi" data={signal.price_change_intervals} />
                </div>
            </div>
        </div>
    );
};