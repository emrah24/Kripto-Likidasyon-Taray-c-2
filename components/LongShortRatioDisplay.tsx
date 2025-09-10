import React from 'react';
import type { LongShortRatio } from '../types';
import { Loader } from './Loader';

interface LongShortRatioDisplayProps {
    ratio: LongShortRatio | null;
    isLoading: boolean;
}

export const LongShortRatioDisplay: React.FC<LongShortRatioDisplayProps> = ({ ratio, isLoading }) => {
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center gap-2 h-16">
                    <Loader className="w-5 h-5 text-cyan-500" />
                    <span className="text-gray-500">Piyasa oranı hesaplanıyor...</span>
                </div>
            );
        }

        if (!ratio) {
            return <div className="text-center text-gray-600 h-16 flex items-center justify-center">Piyasa oranı verisi bekleniyor.</div>;
        }

        return (
            <div>
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                    <span className="text-green-300">Long: {ratio.long.toFixed(2)}%</span>
                    <span className="text-red-400">Short: {ratio.short.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-700 ease-out glow" 
                        style={{ width: `${ratio.long}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-800 shadow-xl">
             <h3 className="text-base font-bold text-center text-gray-400 mb-4 tracking-wider uppercase">Piyasa Geneli Long/Short Oranı</h3>
            {renderContent()}
        </div>
    );
};