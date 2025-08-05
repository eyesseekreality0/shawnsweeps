// Crypto purchase utilities for Shawn Sweepstakes
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
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