'use client';

import { ReactNode } from 'react';
import { Layout } from './Layout';

export function CustomerLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}