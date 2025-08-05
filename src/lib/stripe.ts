// Vert payment utilities
export const createVertPayment = async (paymentData: {
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
    const response = await fetch('/api/create-vert-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create Vert payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Vert payment:', error);
    throw error;
  }
};

export const redirectToVertPayment = (paymentUrl: string) => {
  window.open(paymentUrl, '_blank', 'noopener,noreferrer');
};