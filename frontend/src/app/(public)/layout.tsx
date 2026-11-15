import { Layout } from '@/components/layout';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}