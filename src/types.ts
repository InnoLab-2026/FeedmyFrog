import type { ReactNode } from 'react';

export type Mode = 'need' | 'offer';

export interface Listing {
  id: string;
  title: string;
  description: string;
  tags: string[];
  location: string;
  email: string;
  type: Mode;
}

export interface Category {
  id: string;
  label: string;
  icon: ReactNode;
}