import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const depositSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  gameName: z.string().min(1, "Game name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a valid number greater than 0"),
});

type DepositFormData = z.infer<typeof depositSchema>;

// Initialize Stripe - you'll need to set your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

export const DepositForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const { toast } = useToast();

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      gameName: "",
      amount: "",
    },
  });

  const onSubmit = async (data: DepositFormData) => {
    setIsSubmitting(true);
    try {
      // First create the deposit record
      const { data: depositData, error } = await supabase
        .from("deposits")
        .insert({
          username: data.username,
          email: data.email,
          phone: data.phone,
          game_name: data.gameName,
          amount: parseFloat(data.amount),
          status: "pending_payment",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create Stripe payment intent
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-stripe-payment-intent', {
        body: {
          amount: parseFloat(data.amount),
          currency: 'USD',
          customerEmail: data.email,
          description: `Shawn Sweepstakes deposit for ${data.gameName}`,
          metadata: {
            depositId: depositData.id,
            username: data.username,
            gameName: data.gameName
          }
        }
      });

      if (stripeError || !stripeData.success) {
        console.error('Error creating Stripe payment intent:', stripeError, stripeData);
        toast({
          title: "Payment Setup Error", 
          description: "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Set the payment data for display
      setClientSecret(stripeData.clientSecret);
      setPaymentAmount(parseFloat(data.amount));

      // Show the payment interface
      setShowPayment(true);

      toast({
        title: "Payment Session Created",
        description: "Complete your payment using the secure Stripe checkout.",
      });

    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast({
        title: "Error",
        description: "Failed to create deposit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async () => {
    if (!clientSecret) return;

    const stripe = await stripePromise;
    if (!stripe) {
      toast({
        title: "Error",
        description: "Stripe failed to load. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: clientSecret.split('_secret_')[0] // Extract session ID from client secret
    });

    if (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to redirect to payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setShowPayment(false);
    setClientSecret('');
    setPaymentAmount(0);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
          onClick={() => setIsOpen(true)}
        >
          Make a Deposit 💰
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {!showPayment ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl text-center text-casino-gold">Make a Deposit</DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Enter your details to make a secure deposit via Stripe. All fields are required.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email address" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="Enter your phone number" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gameName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Game Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter the game name" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="Enter deposit amount" 
                          className="h-10 sm:h-11 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 touch-manipulation" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-2xl text-center text-casino-gold">
                Secure Payment
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Complete your ${paymentAmount.toFixed(2)} deposit using Stripe's secure payment system
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Payment Amount Display */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-casino-gold">
                  ${paymentAmount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Secure payment powered by Stripe
                </p>
              </div>
              
              {/* Stripe Payment Button */}
              <Button
                onClick={handleStripePayment}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white touch-manipulation"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay with Stripe
              </Button>
              
              {/* Security Information */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium mb-2">Secure Payment Information:</h4>
                <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside">
                  <li>Your payment is processed securely by Stripe</li>
                  <li>We never store your credit card information</li>
                  <li>All transactions are encrypted and PCI compliant</li>
                  <li>You'll receive an email confirmation after payment</li>
                </ul>
              </div>
              
              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
              >
                Make Another Deposit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};