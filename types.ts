export type SignalType = 'PUMP' | 'DUMP';

export interface LongShortRatio {
  long: number;
  short: number;
}

export interface TimeIntervalChanges {
    '5m': number;
    '15m': number;
    '1h': number;
    '4h': number;
    '8h': number;
    '24h': number;
}

export interface Signal {
  symbol: string;
  signal: SignalType;
  price_change_pct: number;
  price: number;
  last_vol: number;
  avg_vol: number;
  score: number;
  last_vol_usd: number;
  long_short_ratio: LongShortRatio;
  funding_rate: number;
  oi_change: TimeIntervalChanges;
  price_change_intervals: TimeIntervalChanges;
  significance: number;
}

export interface ScanParameters {
    chartInterval: number; // Interval for the data analysis (e.g., 15 min candles)
    scanInterval: number; // How often to run the scan (e.g., every 5 mins)
    lookback: number;
    priceChangeThreshold: number;
    volumeMultiplier: number;
    minVolumeUSD: number;
}

export interface FearAndGreedIndex {
  value: number; // 0-100
  classification: string; // e.g., "Extreme Fear"
}

export interface MarketIndicators {
    btcDominance: number; // as percentage
    totalMarketCap: number; // in USD
    fearAndGreedIndex: FearAndGreedIndex;
}

export interface MarketData {
    signals: Signal[];
    longShortRatio: LongShortRatio;
    marketIndicators: MarketIndicators;
}