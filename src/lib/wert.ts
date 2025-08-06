// Wert.io payment integration for Shawn Sweepstakes
export const createWertPayment = async (paymentData: {
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
    console.log('Creating Wert payment with data:', paymentData);
    
    const supabaseUrl = 'https://dhjopumeiapddbjyleyk.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoam9wdW1laWFwZGRianlsZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzYyNzQsImV4cCI6MjA3MDAxMjI3NH0.i1mNvuRwKj7k43RmyPxZxHSjCsy8Uo5tBL7TqeOdiy4';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-wert-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    console.log('Wert payment function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Wert payment function error response:', errorText);
      throw new Error('Failed to create Wert payment');
    }

    const data = await response.json();
    console.log('Wert payment function success response:', data);
    return data;
  } catch (error) {
    console.error('Error creating Wert payment:', error);
    throw error;
  }
};

export const openWertWidget = (paymentUrl: string) => {
  window.open(paymentUrl, '_blank', 'noopener,noreferrer');
};