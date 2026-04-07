'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  open: boolean;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
];

export default function BarcodeScanner({ onScan, onClose, open }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const startScanner = useCallback(async (facing: 'environment' | 'user') => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    setIsStarting(true);
    setError('');

    try {
      await scanner.start(
        { facingMode: facing },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
        },
        (decodedText) => {
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {},
      );
    } catch (err) {
      setError('Не удалось получить доступ к камере');
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    const scanner = new Html5Qrcode('barcode-reader', {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    startScanner(facingMode);

    return () => {
      scanner.stop().catch(() => {});
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {
      // ignore
    }

    // Clear old scanner and create new one (formats are bound to constructor)
    scanner.clear();
    const newScanner = new Html5Qrcode('barcode-reader', {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });
    scannerRef.current = newScanner;

    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    await startScanner(newFacing);
  }, [facingMode, startScanner]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (code) {
      scannerRef.current?.stop().catch(() => {});
      onScan(code);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Сканировать код</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCamera}
              disabled={isStarting}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Переключить камеру"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Camera preview */}
        <div id="barcode-reader" className="overflow-hidden rounded-xl" />

        {/* Format hint */}
        <p className="mt-2 text-center text-xs text-slate-400">
          QR, EAN-13, EAN-8, Code128, Code39, UPC
        </p>

        {error && (
          <p className="mt-2 text-center text-sm text-red-500">{error}</p>
        )}

        {/* Manual input fallback */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Ввести код вручную"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            OK
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
