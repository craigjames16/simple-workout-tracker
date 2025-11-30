'use client';

import CreatePlan from '@/components/CreatePlan';
import { useNavbar } from '@/contexts/NavbarContext';
import { useEffect } from 'react';

export default function CreatePlanPage() {
  const { setShowBackButton } = useNavbar();
  useEffect(() => {
    setShowBackButton(true);
  }, [setShowBackButton]);
  
  return <CreatePlan />;
} 