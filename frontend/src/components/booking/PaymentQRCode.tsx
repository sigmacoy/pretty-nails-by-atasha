'use client';

import { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentQRCodeProps {
  method: 'GCASH' | 'MAYA';
  amount?: number; // in centavos
  compact?: boolean;
}

export function PaymentQRCode({ method, amount = 10000, compact = false }: PaymentQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const isGcash = method === 'GCASH';
  const brandName = isGcash ? 'GCash' : 'Maya';
  const accountName = 'Pretty Nails by Atasha';
  const accountNumber = isGcash ? '0917 123 4567' : '0918 987 6543';
  const rawNumber = isGcash ? '09171234567' : '09189876543';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rawNumber);
      setCopied(true);
      toast.success(`${brandName} number copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formattedAmount = `₱${(amount / 100).toFixed(2)}`;

  return (
    <div className="rounded-[12px] border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 p-4 sm:p-5 transition-colors">
      <div className={`flex ${compact ? 'flex-col items-center gap-3 text-center' : 'flex-col sm:flex-row items-center sm:items-start gap-5'}`}>
        {/* QR Code Container */}
        <div className="relative flex-shrink-0 bg-white p-3 rounded-[8px] border border-stone-200/90 dark:border-stone-700 shadow-xs">
          <svg
            className={compact ? 'h-32 w-32' : 'h-36 w-36'}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`${brandName} QR Code for Pretty Nails by Atasha`}
          >
            {/* Background */}
            <rect width="100" height="100" fill="white" />

            {/* Top-Left Finder */}
            <rect x="6" y="6" width="26" height="26" rx="3" fill="#1c1917" />
            <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
            <rect x="14" y="14" width="10" height="10" rx="1" fill="#1c1917" />

            {/* Top-Right Finder */}
            <rect x="68" y="6" width="26" height="26" rx="3" fill="#1c1917" />
            <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
            <rect x="76" y="14" width="10" height="10" rx="1" fill="#1c1917" />

            {/* Bottom-Left Finder */}
            <rect x="6" y="68" width="26" height="26" rx="3" fill="#1c1917" />
            <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
            <rect x="14" y="76" width="10" height="10" rx="1" fill="#1c1917" />

            {/* Timing Patterns */}
            <path d="M36 10h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4z" fill="#44403c" />
            <path d="M10 36h4v4h-4zm0 8h4v4h-4zm0 8h4v4h-4zm0 8h4v4h-4z" fill="#44403c" />

            {/* Data Modules */}
            <rect x="36" y="20" width="4" height="4" fill="#292524" />
            <rect x="44" y="20" width="8" height="4" fill="#292524" />
            <rect x="56" y="20" width="4" height="4" fill="#292524" />

            <rect x="36" y="28" width="8" height="4" fill="#292524" />
            <rect x="48" y="28" width="4" height="4" fill="#292524" />
            <rect x="56" y="28" width="8" height="4" fill="#292524" />

            <rect x="68" y="36" width="4" height="8" fill="#292524" />
            <rect x="76" y="36" width="8" height="4" fill="#292524" />
            <rect x="88" y="36" width="4" height="4" fill="#292524" />

            <rect x="20" y="36" width="4" height="4" fill="#292524" />
            <rect x="28" y="36" width="4" height="8" fill="#292524" />

            <rect x="20" y="44" width="8" height="4" fill="#292524" />
            <rect x="68" y="48" width="8" height="4" fill="#292524" />
            <rect x="80" y="44" width="4" height="8" fill="#292524" />

            <rect x="20" y="56" width="4" height="8" fill="#292524" />
            <rect x="28" y="56" width="4" height="4" fill="#292524" />
            <rect x="68" y="56" width="4" height="4" fill="#292524" />
            <rect x="76" y="56" width="8" height="8" fill="#292524" />
            <rect x="88" y="56" width="4" height="4" fill="#292524" />

            <rect x="36" y="68" width="8" height="4" fill="#292524" />
            <rect x="48" y="68" width="4" height="8" fill="#292524" />
            <rect x="56" y="68" width="4" height="4" fill="#292524" />

            <rect x="36" y="76" width="4" height="4" fill="#292524" />
            <rect x="44" y="80" width="8" height="4" fill="#292524" />
            <rect x="56" y="76" width="8" height="4" fill="#292524" />

            <rect x="68" y="76" width="4" height="8" fill="#292524" />
            <rect x="76" y="80" width="8" height="4" fill="#292524" />
            <rect x="88" y="76" width="4" height="8" fill="#292524" />

            <rect x="36" y="88" width="8" height="4" fill="#292524" />
            <rect x="52" y="88" width="8" height="4" fill="#292524" />

            {/* Center Brand Badge */}
            <rect x="36" y="36" width="28" height="28" rx="6" fill="white" stroke="#e7e5e4" strokeWidth="1" />
            <rect x="39" y="39" width="22" height="22" rx="4" fill="#1c1917" />
            <text
              x="50"
              y="53"
              fill="white"
              fontSize="6.5"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="sans-serif"
              letterSpacing="0.5"
            >
              {isGcash ? 'GCASH' : 'MAYA'}
            </text>
          </svg>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-medium tracking-wide bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900">
              <QrCode className="h-2.5 w-2.5 stroke-[1.5]" />
              Scan QR
            </span>
          </div>
        </div>

        {/* Account Details */}
        <div className={`flex-1 space-y-3 ${compact ? 'text-center' : 'text-center sm:text-left'}`}>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-medium text-base text-stone-900 dark:text-stone-100">{brandName} official account</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-stone-500 dark:text-stone-400">
              Account name: <span className="font-medium text-stone-900 dark:text-stone-100">{accountName}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-stone-500 dark:text-stone-400">Account no:</span>
              <span className="px-2 py-0.5 rounded-[6px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 font-mono font-medium text-stone-900 dark:text-stone-100 text-xs tabular-nums">
                {accountNumber}
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                title={`Copy ${brandName} number`}
                aria-label={`Copy ${brandName} number`}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400 stroke-[1.5]" /> : <Copy className="h-3.5 w-3.5 stroke-[1.5]" />}
              </button>
            </div>
            <div className="text-stone-500 dark:text-stone-400 pt-0.5">
              Downpayment fee: <span className="font-medium text-stone-900 dark:text-stone-100 tabular-nums">{formattedAmount}</span>
            </div>
          </div>

          <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800/60 p-2.5 rounded-[8px] border border-stone-200/60 dark:border-stone-700/60 leading-relaxed">
            Scan the QR code or send payment to the number above, then enter your reference number below to secure your appointment.
          </div>
        </div>
      </div>
    </div>
  );
}
