import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] dark:bg-[#160D12] text-foreground selection:bg-rose-200 selection:text-rose-950 px-4 py-8 sm:py-12 transition-colors">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
