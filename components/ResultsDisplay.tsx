import React from 'react';
import type { Signal } from '../types';
import { Loader } from './Loader';
import { SignalCard } from './SignalRow';

interface ResultsDisplayProps {
    signals: Signal[];
    isLoading: boolean;
    error: string | null;
    hasScanned: boolean;
    isScanningActive: boolean;
    countdown: number;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-700 mb-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const EmptyState: React.FC<{ title: string, message: string }> = ({ title, message }) => (
    <div className="text-center py-16 px-6 bg-gray-900/30 rounded-lg border border-dashed border-gray-800 flex flex-col items-center">
        <SearchIcon />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
        <p className="text-gray-500 max-w-md">{message}</p>
    </div>
);

const CountdownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return (
        <span className="text-sm font-medium text-gray-500 ml-4">
            (Sonraki tarama: {minutes}:{remainingSeconds.toString().padStart(2, '0')})
        </span>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ signals, isLoading, error, hasScanned, isScanningActive, countdown }) => {

    const renderContent = () => {
        if (isLoading && signals.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="w-12 h-12 text-cyan-500" />
                    <p className="mt-6 text-lg font-medium text-gray-400">Piyasalar anormallikler için taranıyor...</p>
                </div>
            );
        }

        if (error) {
            return <EmptyState title="Hata Oluştu" message={`Sinyaller alınamadı: ${error}`} />;
        }

        if (!hasScanned) {
             return <EmptyState title="Taramaya Hazır" message="Piyasa anormalliklerini aramaya başlamak için 'Taramayı Başlat' düğmesine tıklayın." />;
        }
        
        if (signals.length === 0 && !isLoading) {
            return <EmptyState title="Sinyal Bulunamadı" message="Tarama tamamlandı, ancak kriterlerinize göre önemli bir piyasa sinyali tespit edilmedi." />;
        }
        
        return (
             <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                {signals.map((signal, index) => (
                    <SignalCard key={`${signal.symbol}-${index}`} signal={signal} />
                ))}
            </div>
        );
    };

    return (
        <div className="mt-10">
            <div className="flex items-center mb-5">
                <h2 className="text-2xl font-bold text-gray-300">Tarama Sonuçları</h2>
                 {isScanningActive && !isLoading && <CountdownTimer seconds={countdown} />}
                 {isScanningActive && isLoading && (
                    <div className="flex items-center ml-4">
                         <Loader className="w-4 h-4 text-cyan-500" />
                         <span className="text-sm text-gray-500 ml-2">Yeni veriler alınıyor...</span>
                    </div>
                 )}
            </div>
            {renderContent()}
        </div>
    );
};