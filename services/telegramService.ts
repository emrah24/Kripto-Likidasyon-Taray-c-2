import type { MarketData } from '../types';

const BOT_TOKEN = "8457244302:AAHLqG3vd56m65X-ujGzJvUsRpnbUKdpm2o";
const CHAT_ID = "-1002878012516";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const formatNumber = (num: number) => {
    if (num >= 1_000_000_000_000) {
        return `${(num / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2)}B`;
    }
    return num.toLocaleString();
};

const formatSignalsToHTML = (marketData: MarketData): string => {
    const { signals, longShortRatio, marketIndicators } = marketData;

    const marketIndicatorsHeader = `
📉 <b>Piyasa Durumu</b>
    ├─ BTC.D: <b>${marketIndicators.btcDominance.toFixed(2)}%</b>
    ├─ Toplam Piy. Değ: <b>$${formatNumber(marketIndicators.totalMarketCap)}</b>
    └─ F&G Endeksi: <b>${marketIndicators.fearAndGreedIndex.value}</b> (${marketIndicators.fearAndGreedIndex.classification})
    `;

    const marketRatioHeader = `📊 <b>Piyasa Geneli L/S:</b> ${longShortRatio.long.toFixed(2)}% Long / ${longShortRatio.short.toFixed(2)}% Short\n`;
    const header = `🚨 <b>Kripto Likidasyon Taraması (Otomatik)</b> 🚨\n\nEn Yüksek Skorlu Sinyaller:\n`;
    const topSignals = signals.slice(0, 10);

    const signalLines = topSignals.map(s => {
        const displayName = s.symbol.replace('BINANCE:', '').replace('PERP', '');
        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${s.symbol}`;
        const coinglassUrl = `https://www.coinglass.com/tv/Binance_${displayName}`;
        const icon = s.signal === 'PUMP' ? '🟢' : '🔴';
        const priceChangePrefix = s.signal === 'PUMP' ? '+' : '';
        const stars = '★'.repeat(s.significance);
        const significancePrefix = stars ? `[${stars}] ` : '';
        
        const mainLine = `${significancePrefix}${icon} <b>${displayName}</b> | ${s.signal} | Δ%: ${priceChangePrefix}${s.price_change_pct.toFixed(2)}% | Skor: ${s.score.toFixed(2)}`;
        
        const fundingLine = `    ├─ Funding: ${s.funding_rate.toFixed(4)}%`;
        const oiLine = `    ├─ OI Δ (5m/1h/24h): ${s.oi_change['5m'].toFixed(2)}% / ${s.oi_change['1h'].toFixed(2)}% / ${s.oi_change['24h'].toFixed(2)}%`;
        const priceLine = `    ├─ Fiyat Δ (5m/1h/24h): ${s.price_change_intervals['5m'].toFixed(2)}% / ${s.price_change_intervals['1h'].toFixed(2)}% / ${s.price_change_intervals['24h'].toFixed(2)}%`;
        const linksLine = `    └─ 🔗 <a href="${tradingViewUrl}">TradingView</a> | <a href="${coinglassUrl}">CoinGlass</a>`;

        return `${mainLine}\n${fundingLine}\n${oiLine}\n${priceLine}\n${linksLine}`;
    }).join('\n\n');

    return `${marketIndicatorsHeader}\n${marketRatioHeader}\n${header}\n${signalLines}`;
};

export const sendSignalsToTelegram = async (marketData: MarketData): Promise<void> => {
    if (!marketData || !marketData.signals || marketData.signals.length === 0) {
        console.log("Telegram'a gönderilecek sinyal yok.");
        return;
    }
    
    const message = formatSignalsToHTML(marketData);

    try {
        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });
        
        const responseData = await response.json();

        if (!response.ok || !responseData.ok) {
            console.error('Telegram API Hatası:', responseData);
            throw new Error(`Telegram'a gönderim başarısız oldu: ${responseData.description || 'Bilinmeyen hata'}`);
        }
        
    } catch (error) {
        console.error("Telegram gönderme servisinde hata:", error);
        throw error;
    }
};