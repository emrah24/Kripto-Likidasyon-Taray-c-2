import React from 'react';
import { Loader } from './Loader';
import type { ScanParameters } from '../types';
import { TelegramIcon } from './icons';

interface ScanControlsProps {
    onToggleScan: () => void;
    isScanningActive: boolean;
    isLoading: boolean;
    parameters: ScanParameters;
    onParametersChange: (newParams: Partial<ScanParameters>) => void;
    isTelegramAutoSendEnabled: boolean;
    onTelegramAutoSendChange: (enabled: boolean) => void;
}

interface ParameterInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit?: string;
    step?: number;
    min?: number;
    disabled?: boolean;
}

const ParameterInput: React.FC<ParameterInputProps> = ({ label, value, onChange, unit, step = 1, min = 0, disabled = false }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = e.target.valueAsNumber;
        if (!isNaN(numValue)) {
            onChange(numValue);
        } else if (e.target.value === '') {
            onChange(min); // Boşsa minimuma sıfırla
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 text-center truncate uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    step={step}
                    min={min}
                    disabled={disabled}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2 text-center text-lg font-semibold text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">{unit}</span>}
            </div>
        </div>
    );
};

const TelegramToggle: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void, disabled: boolean }> = ({ enabled, onChange, disabled }) => (
    <div className="flex items-center gap-3">
        <TelegramIcon className="w-6 h-6 text-cyan-400" />
        <span className="text-sm font-medium text-gray-300 hidden sm:inline">Otomatik Gönderim</span>
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled ? 'bg-cyan-500' : 'bg-gray-700'
            }`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);

export const ScanControls: React.FC<ScanControlsProps> = ({ onToggleScan, isScanningActive, isLoading, parameters, onParametersChange, isTelegramAutoSendEnabled, onTelegramAutoSendChange }) => {
    const buttonText = isScanningActive ? "Taramayı Durdur" : "Taramayı Başlat";
    const buttonBaseClass = "relative w-full max-w-xs px-8 py-3 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed overflow-hidden shadow-lg transform hover:-translate-y-1";
    const buttonClass = isScanningActive
        ? `bg-red-600 hover:bg-red-700 focus:ring-red-500 hover:shadow-red-500/30`
        : `bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 hover:shadow-cyan-400/30`;

    return (
        <div className="my-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-300 mb-3 sm:mb-0">Tarama Parametreleri</h2>
                 <TelegramToggle enabled={isTelegramAutoSendEnabled} onChange={onTelegramAutoSendChange} disabled={isScanningActive} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
                <ParameterInput label="Grafik Aralığı" value={parameters.chartInterval} onChange={(v) => onParametersChange({ chartInterval: v })} unit="dk" min={1} disabled={isScanningActive} />
                <ParameterInput label="Tarama Aralığı" value={parameters.scanInterval} onChange={(v) => onParametersChange({ scanInterval: v })} unit="dk" min={1} disabled={isScanningActive} />
                <ParameterInput label="Geriye Dönük" value={parameters.lookback} onChange={(v) => onParametersChange({ lookback: v })} unit="mum" min={10} disabled={isScanningActive} />
                <ParameterInput label="Fiyat Değişimi" value={parameters.priceChangeThreshold} onChange={(v) => onParametersChange({ priceChangeThreshold: v })} unit="%" step={0.1} min={0} disabled={isScanningActive} />
                <ParameterInput label="Hacim Çarpanı" value={parameters.volumeMultiplier} onChange={(v) => onParametersChange({ volumeMultiplier: v })} unit="x" step={0.1} min={1} disabled={isScanningActive} />
                <ParameterInput label="Min Hacim" value={parameters.minVolumeUSD} onChange={(v) => onParametersChange({ minVolumeUSD: v })} unit="$" step={10000} min={0} disabled={isScanningActive} />
            </div>
            <div className="text-center">
                <button
                    onClick={onToggleScan}
                    disabled={isLoading && !isScanningActive}
                    className={`${buttonBaseClass} ${buttonClass}`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader className="w-6 h-6 mr-3" />
                            <span>Taranıyor...</span>
                        </div>
                    ) : (
                        <span>{buttonText}</span>
                    )}
                </button>
            </div>
        </div>
    );
};