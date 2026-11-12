'use client';

import { useState } from 'react';
import { Copy, Check, QrCode, Smartphone } from 'lucide-react';
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
  const brandColor = isGcash ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400';
  const brandBorder = isGcash ? 'border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20' : 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20';
  const brandBadge = isGcash ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rawNumber);
      setCopied(true);
      toast.success(`${brandName} number copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${brandBorder} transition-all`}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* QR Code Container */}
        <div className="relative flex-shrink-0 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <svg
            className={compact ? 'h-32 w-32' : 'h-40 w-40'}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`${brandName} QR Code for Pretty Nails by Atasha`}
          >
            {/* Background */}
            <rect width="100" height="100" fill="white" />

            {/* Top-Left Finder */}
            <rect x="6" y="6" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
            <rect x="14" y="14" width="10" height="10" rx="1.5" fill={isGcash ? '#007DFE' : '#059669'} />

            {/* Top-Right Finder */}
            <rect x="68" y="6" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
            <rect x="76" y="14" width="10" height="10" rx="1.5" fill={isGcash ? '#007DFE' : '#059669'} />

            {/* Bottom-Left Finder */}
            <rect x="6" y="68" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
            <rect x="14" y="76" width="10" height="10" rx="1.5" fill={isGcash ? '#007DFE' : '#059669'} />

            {/* Timing Patterns */}
            <path d="M36 10h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4z" fill="#334155" />
            <path d="M10 36h4v4h-4zm0 8h4v4h-4zm0 8h4v4h-4zm0 8h4v4h-4z" fill="#334155" />

            {/* Data Modules (Stylized Matrix) */}
            <rect x="36" y="20" width="4" height="4" fill="#1e293b" />
            <rect x="44" y="20" width="8" height="4" fill="#1e293b" />
            <rect x="56" y="20" width="4" height="4" fill="#1e293b" />

            <rect x="36" y="28" width="8" height="4" fill="#1e293b" />
            <rect x="48" y="28" width="4" height="4" fill="#1e293b" />
            <rect x="56" y="28" width="8" height="4" fill="#1e293b" />

            <rect x="68" y="36" width="4" height="8" fill="#1e293b" />
            <rect x="76" y="36" width="8" height="4" fill="#1e293b" />
            <rect x="88" y="36" width="4" height="4" fill="#1e293b" />

            <rect x="20" y="36" width="4" height="4" fill="#1e293b" />
            <rect x="28" y="36" width="4" height="8" fill="#1e293b" />

            <rect x="20" y="44" width="8" height="4" fill="#1e293b" />
            <rect x="68" y="48" width="8" height="4" fill="#1e293b" />
            <rect x="80" y="44" width="4" height="8" fill="#1e293b" />

            <rect x="20" y="56" width="4" height="8" fill="#1e293b" />
            <rect x="28" y="56" width="4" height="4" fill="#1e293b" />
            <rect x="68" y="56" width="4" height="4" fill="#1e293b" />
            <rect x="76" y="56" width="8" height="8" fill="#1e293b" />
            <rect x="88" y="56" width="4" height="4" fill="#1e293b" />

            <rect x="36" y="68" width="8" height="4" fill="#1e293b" />
            <rect x="48" y="68" width="4" height="8" fill="#1e293b" />
            <rect x="56" y="68" width="4" height="4" fill="#1e293b" />

            <rect x="36" y="76" width="4" height="4" fill="#1e293b" />
            <rect x="44" y="80" width="8" height="4" fill="#1e293b" />
            <rect x="56" y="76" width="8" height="4" fill="#1e293b" />

            <rect x="68" y="76" width="4" height="8" fill="#1e293b" />
            <rect x="76" y="80" width="8" height="4" fill="#1e293b" />
            <rect x="88" y="76" width="4" height="8" fill="#1e293b" />

            <rect x="36" y="88" width="8" height="4" fill="#1e293b" />
            <rect x="52" y="88" width="8" height="4" fill="#1e293b" />

            {/* Center Brand Badge */}
            <rect x="37" y="37" width="26" height="26" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="40" y="40" width="20" height="20" rx="4" fill={isGcash ? '#007DFE' : '#059669'} />
            <text
              x="50"
              y="53"
              fill="white"
              fontSize="7"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {isGcash ? 'GCASH' : 'MAYA'}
            </text>
          </svg>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${brandBadge}`}>
              Scan QR
            </span>
          </div>
        </div>

        {/* Account Details */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className={`font-bold text-lg ${brandColor}`}>{brandName} Official Account</span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="text-gray-500 dark:text-gray-400">
              Account Name: <strong className="text-gray-900 dark:text-gray-100 font-semibold">{accountName}</strong>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-gray-500 dark:text-gray-400">Account No:</span>
              <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
                {accountNumber}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title={`Copy ${brandName} Number`}
                aria-label={`Copy ${brandName} Number`}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              Downpayment Amount: <strong className="text-primary font-semibold">₱{(amount / 100).toFixed(2)}</strong>
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-200/60 dark:border-gray-800">
            💡 Scan the QR code or send payment to the number above, then copy your <strong>Reference No.</strong> below.
          </div>
        </div>
      </div>
    </div>
  );
}
