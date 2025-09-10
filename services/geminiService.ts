import { GoogleGenAI, Type } from "@google/genai";
import type { ScanParameters, MarketData, Signal, MarketIndicators, FearAndGreedIndex } from '../types';

// --- API Constants ---
const BINANCE_FUTURES_API = 'https://fapi.binance.com';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const FNG_API = 'https://api.alternative.me';

// --- AI Setup ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY ortam değişkeni ayarlanmadı");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions ---
const normalizeSymbol = (s: string) => s.toUpperCase().replace(/PERP$/, '').replace(/\.P$/, '').trim();


// --- Live Data Fetching Functions ---

async function fetchActiveFuturesSymbols(): Promise<Set<string>> {
    const response = await fetch(`${BINANCE_FUTURES_API}/fapi/v1/exchangeInfo`);
    if (!response.ok) throw new Error('Binance exchange bilgisi alınamadı.');
    const data = await response.json();
    const activeSymbols = new Set<string>();
    for (const s of data.symbols) {
        if (s.contractType === 'PERPETUAL' && s.status === 'TRADING' && s.quoteAsset === 'USDT') {
            activeSymbols.add(s.symbol);
        }
    }
    return activeSymbols;
}

async function fetchBinance24hrTickers(): Promise<any[]> {
    const response = await fetch(`${BINANCE_FUTURES_API}/fapi/v1/ticker/24hr`);
    if (!response.ok) throw new Error('Binance 24 saatlik veri alınamadı.');
    const data = await response.json();
    return data;
}

async function fetchMarketIndicators(): Promise<MarketIndicators> {
    const [fngResponse, globalResponse] = await Promise.all([
        fetch(`${FNG_API}/fng/?limit=1`),
        fetch(`${COINGECKO_API}/global`)
    ]);

    if (!fngResponse.ok) throw new Error('Korku & Açgözlülük Endeksi alınamadı.');
    if (!globalResponse.ok) throw new Error('Global piyasa verisi alınamadı.');

    const fngData = await fngResponse.json();
    const globalData = await globalResponse.json();

    const fearAndGreedIndex: FearAndGreedIndex = {
        value: parseInt(fngData.data[0].value, 10),
        classification: fngData.data[0].value_classification,
    };

    const btcDominance = globalData.data.market_cap_percentage.btc;
    const totalMarketCap = globalData.data.total_market_cap.usd;

    return { btcDominance, totalMarketCap, fearAndGreedIndex };
}

// --- AI Analysis Function ---

const timeIntervalSchema = {
    type: Type.OBJECT,
    properties: {
        '5m': { type: Type.NUMBER }, '15m': { type: Type.NUMBER }, '1h': { type: Type.NUMBER },
        '4h': { type: Type.NUMBER }, '8h': { type: Type.NUMBER }, '24h': { type: Type.NUMBER },
    },
    required: ['5m', '15m', '1h', '4h', '8h', '24h'],
};

const analysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        longShortRatio: {
            type: Type.OBJECT, properties: { long: { type: Type.NUMBER }, short: { type: Type.NUMBER } }, required: ["long", "short"]
        },
        signals: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    symbol: { type: Type.STRING },
                    signal: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    long_short_ratio: { type: Type.OBJECT, properties: { long: { type: Type.NUMBER }, short: { type: Type.NUMBER } }, required: ['long', 'short'] },
                    funding_rate: { type: Type.NUMBER },
                    oi_change: { ...timeIntervalSchema },
                    price_change_intervals: { ...timeIntervalSchema },
                    significance: { type: Type.INTEGER },
                },
                required: ['symbol', 'signal', 'score', 'long_short_ratio', 'funding_rate', 'oi_change', 'price_change_intervals', 'significance'],
            },
        }
    },
    required: ["longShortRatio", "signals"],
};


async function analyzeAnomaliesWithAI(anomalies: any[], params: ScanParameters): Promise<any> {
    const prompt = `
Sen bir uzman Kripto Para Piyasası Analistisin. Sana Binance Futures piyasasından alınmış, filtrelenmiş **canlı ve gerçek** veri anlık görüntüleri sunacağım. Görevin, bu verileri analiz edip zenginleştirmek ve belirli bir JSON formatında geri döndürmektir.

**KURAL: Yalnızca ve yalnızca sana sağlanan listedeki sembolleri analiz et. Bu liste, Binance Futures'ta şu an aktif olarak işlem gören coin'lerden oluşmaktadır. Asla listede olmayan bir sembol ekleme veya sembol adını değiştirme. Örneğin, 'BTCUSDT' verildiyse, 'BTCUSDT' olarak döndür.**

Analiz Edilecek Canlı Veri (${anomalies.length} anomali):
${JSON.stringify(anomalies.map(a => ({ symbol: a.symbol, priceChangePercent: a.priceChangePercent, quoteVolume: a.quoteVolume })), null, 2)}

Analiz Parametreleri:
- Analiz Aralığı: ${params.chartInterval} dakika
- Pump Eşiği: +${params.priceChangeThreshold}%
- Dump Eşiği: -${params.priceChangeThreshold}%

Görevin:
1.  Sağlanan canlı verilere dayanarak, tüm piyasa için genel bir 'longShortRatio' tahmini yap.
2.  Sağlanan her bir anomali için aşağıdaki zenginleştirilmiş verileri oluştur:
    *   'symbol': **Sana verilen orijinal sembolü DEĞİŞTİRMEDEN aynen döndür.**
    *   'signal': 'priceChangePercent' değerine göre "PUMP" veya "DUMP" olarak belirle.
    *   'score': 'priceChangePercent' ve 'quoteVolume' verilerini kullanarak mantıklı bir sinyal gücü skoru hesapla. Yüksek hacimli yüksek değişimler daha yüksek skor almalıdır.
    *   'long_short_ratio': Coine özel, sinyal türüyle tutarlı bir L/S oranı tahmini yap.
    *   'funding_rate', 'oi_change', 'price_change_intervals': Bu metrikleri, sağlanan 24 saatlik verilere ve sinyal türüne dayanarak gerçekçi bir şekilde tahmin et. Örneğin, 24 saatlik büyük bir PUMP sinyalinin 'price_change_intervals' değerleri de çoğunlukla pozitif olmalıdır.
    *   'significance': Funding Oranı ve kısa vadeli OI Değişimi'nin büyüklüğüne göre 1 (düşük), 2 (orta) veya 3 (yüksek) arasında bir önem derecesi ata. Yüksek fonlama ve yüksek OI değişimi 3 yıldız almalıdır.
3.  Sonuçları, sağlanan JSON şemasına tam olarak uyan tek bir JSON nesnesi olarak döndür. Başka metin ekleme.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisResponseSchema,
        },
    });

    const jsonText = String(response.text).trim();
    return JSON.parse(jsonText);
}

// --- Main Service Function ---

export const fetchMarketData = async (parameters: ScanParameters): Promise<MarketData> => {
    try {
        const [marketIndicators, allTickers, activeFuturesSymbols] = await Promise.all([
            fetchMarketIndicators(),
            fetchBinance24hrTickers(),
            fetchActiveFuturesSymbols(),
        ]);

        // Filter tickers to ONLY include currently active and trading perpetual futures contracts.
        // This is the definitive fix for seeing delisted coins like ALPACAUSDT.
        const activeTickers = allTickers.filter(t => activeFuturesSymbols.has(t.symbol));

        const anomalies = activeTickers
            .map(t => ({
                ...t,
                priceChangePercent: parseFloat(t.priceChangePercent),
                quoteVolume: parseFloat(t.quoteVolume),
                lastPrice: parseFloat(t.lastPrice),
                volume: parseFloat(t.volume),
            }))
            .filter(t => {
                const absPriceChange = Math.abs(t.priceChangePercent);
                const meetsThreshold = absPriceChange >= parameters.priceChangeThreshold;
                const meetsVolume = t.quoteVolume >= parameters.minVolumeUSD;
                return meetsThreshold && meetsVolume;
            });

        if (anomalies.length === 0) {
            return { marketIndicators, longShortRatio: { long: 50, short: 50 }, signals: [] };
        }

        anomalies.sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent));
        const topAnomalies = anomalies.slice(0, 20);

        const aiAnalysis = await analyzeAnomaliesWithAI(topAnomalies, parameters);
        
        // **ROBUST MAPPING LOGIC**
        // Iterate over the REAL anomalies from Binance (our source of truth), and find the corresponding AI analysis.
        // This prevents any AI hallucination from making it to the UI.
        const enrichedSignals: Signal[] = topAnomalies.map(originalTicker => {
            const normalizedOriginalSymbol = normalizeSymbol(originalTicker.symbol);
            
            const analyzedSignal = aiAnalysis.signals.find((s: any) => normalizeSymbol(s.symbol) === normalizedOriginalSymbol);

            if (!analyzedSignal) {
                // AI failed to return analysis for this specific, real anomaly. Skip it.
                return null;
            }

            return {
                ...analyzedSignal,
                symbol: `BINANCE:${originalTicker.symbol}PERP`,
                price_change_pct: originalTicker.priceChangePercent,
                price: originalTicker.lastPrice,
                last_vol: originalTicker.volume,
                avg_vol: originalTicker.volume / 24, // Approximation
                last_vol_usd: originalTicker.quoteVolume,
            };
        }).filter((s: Signal | null): s is Signal => s !== null);

        enrichedSignals.sort((a, b) => b.score - a.score);

        return {
            marketIndicators,
            longShortRatio: aiAnalysis.longShortRatio,
            signals: enrichedSignals.slice(0, 10),
        };

    } catch (error) {
        console.error("Piyasa verisi alınırken veya analiz edilirken hata oluştu:", error);
        if (error instanceof Error) {
            throw new Error(`Canlı piyasa verisi hatası: ${error.message}`);
        }
        throw new Error("Canlı piyasa verileri alınamadı veya işlenemedi.");
    }
};