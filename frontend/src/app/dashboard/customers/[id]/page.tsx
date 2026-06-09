'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ContactProfileView } from '@/components/contact/ContactProfileView';

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id as string;

  return <ContactProfileView customerId={customerId} />;
}
