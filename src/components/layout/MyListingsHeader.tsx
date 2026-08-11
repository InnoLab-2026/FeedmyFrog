'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';

export default function MyListingsHeader({ email }: { email: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Header
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showMyListingsButton={false}
      email={email}
    />
  );
}
