import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ScanControls } from './components/ScanControls';
import { ResultsDisplay } from './components/ResultsDisplay';
import { fetchMarketData } from './services/geminiService';
import { sendSignalsToTelegram } from './services/telegramService';
import { LongShortRatioDisplay } from './components/LongShortRatioDisplay';
import { MarketIndicatorsDisplay } from './components/MarketIndicatorsDisplay';
import type { Signal, ScanParameters, LongShortRatio, MarketIndicators } from './types';

const App: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [longShortRatio, setLongShortRatio] = useState<LongShortRatio | null>(null);
    const [marketIndicators, setMarketIndicators] = useState<MarketIndicators | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState<boolean>(false);
    const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [isTelegramAutoSendEnabled, setIsTelegramAutoSendEnabled] = useState<boolean>(true);
    
    const [parameters, setParameters] = useState<ScanParameters>({
        chartInterval: 15,
        scanInterval: 5,
        lookback: 50,
        priceChangeThreshold: 2.0,
        volumeMultiplier: 3,
        minVolumeUSD: 500000,
    });

    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleParametersChange = useCallback((newParams: Partial<ScanParameters>) => {
        setParameters(prev => ({ ...prev, ...newParams }));
    }, []);

    const runScan = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        if (!hasScanned) setHasScanned(true);
        try {
            const marketData = await fetchMarketData(parameters);
            setSignals(marketData.signals);
            setLongShortRatio(marketData.longShortRatio);
            setMarketIndicators(marketData.marketIndicators);

            if (isTelegramAutoSendEnabled && marketData.signals.length > 0) {
                try {
                    await sendSignalsToTelegram(marketData);
                    console.log("Piyasa verileri otomatik olarak Telegram'a gönderildi.");
                } catch (telegramError) {
                    console.error("Verileri Telegram'a otomatik gönderme başarısız oldu:", telegramError);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
            setSignals([]);
            setLongShortRatio(null);
            setMarketIndicators(null);
            setIsScanningActive(false); // Hata durumunda taramayı durdur
        } finally {
            setIsLoading(false);
        }
    }, [parameters, hasScanned, isTelegramAutoSendEnabled]);

    const startCountdown = useCallback(() => {
        setCountdown(parameters.scanInterval * 60);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
    }, [parameters.scanInterval]);

    useEffect(() => {
        if (isScanningActive) {
            runScan(); // Başlatıldığında hemen çalıştır
            startCountdown();
            scanIntervalRef.current = setInterval(() => {
                runScan();
                startCountdown();
            }, parameters.scanInterval * 60 * 1000);
        } else {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setCountdown(0);
        }

        return () => {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isScanningActive, parameters.scanInterval, runScan, startCountdown]);

    const handleToggleScan = () => {
        setIsScanningActive(prev => !prev);
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Header />
                <main className="mt-8">
                    <MarketIndicatorsDisplay 
                        indicators={marketIndicators} 
                        isLoading={isLoading && !hasScanned} 
                    />
                    <LongShortRatioDisplay 
                        ratio={longShortRatio}
                        isLoading={isLoading && !hasScanned}
                    />
                    <ScanControls 
                        onToggleScan={handleToggleScan} 
                        isScanningActive={isScanningActive}
                        isLoading={isLoading}
                        parameters={parameters}
                        onParametersChange={handleParametersChange}
                        isTelegramAutoSendEnabled={isTelegramAutoSendEnabled}
                        onTelegramAutoSendChange={setIsTelegramAutoSendEnabled}
                    />
                    <ResultsDisplay
                        signals={signals}
                        isLoading={isLoading}
                        error={error}
                        hasScanned={hasScanned}
                        isScanningActive={isScanningActive}
                        countdown={countdown}
                    />
                </main>
                <footer className="text-center text-gray-600 mt-16 text-xs border-t border-gray-800 pt-8">
                    <p>Fiyatlar ve 24s hacim verileri Binance'ten, piyasa göstergeleri CoinGecko & Alternative.me'den canlı olarak alınmaktadır. Diğer veriler yapay zeka analizi ile zenginleştirilmiştir. Yatırım tavsiyesi değildir.</p>
                    <p className="mt-1">&copy; 2024 Kripto Likidasyon Tarayıcı. Tüm hakları saklıdır.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;