'use client';

import { ReactNode } from 'react';
import { Layout } from '@/components/layout';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}