import { supabase } from '@/integrations/supabase/client';

// Payment utilities for Shawn Sweepstakes
export const createPayment = async (paymentData: {
  amount: number;
  currency: string;
  customerEmail: string;
  description: string;
  metadata: {
    depositId: string;
    username: string;
    gameName: string;
  };
}) => {
  try {
    const supabaseUrl = 'https://vbeirjdjfvmtwkljscwb.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZWlyamRqZnZtdHdrbGpzY3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MjM4NzAsImV4cCI6MjA2OTA5OTg3MH0.D6wvYJ9AwwuZn56nWq5FFwLCnuAIoyljQM2tR1Ze7DI';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-wert-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const redirectToPayment = (paymentUrl: string) => {
  window.open(paymentUrl, '_blank', 'noopener,noreferrer');
};