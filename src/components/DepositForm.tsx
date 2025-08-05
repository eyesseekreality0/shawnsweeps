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
import { CreditCard, Loader2, Shield } from 'lucide-react';

const depositSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  gameName: z.string().min(1, "Game name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a valid number greater than 0"),
});

type DepositFormData = z.infer<typeof depositSchema>;

export const DepositForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Deposit created successfully:', depositData);

      // Create Vert payment session
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      console.log('Creating Vert payment for deposit:', depositData.id);

      const apiUrl = `${supabaseUrl}/functions/v1/create-vert-payment`;
      console.log('Calling Vert API at:', apiUrl);
      
      const vertResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          currency: 'USD',
          customerEmail: data.email,
          description: `Shawn Sweepstakes deposit for ${data.gameName}`,
          metadata: {
            depositId: depositData.id,
            username: data.username,
            gameName: data.gameName
          }
        })
      });

      console.log('Vert response status:', vertResponse.status);
      console.log('Vert response headers:', Object.fromEntries(vertResponse.headers.entries()));
      
      if (!vertResponse.ok) {
        let errorText;
        try {
          errorText = await vertResponse.text();
        } catch (e) {
          errorText = `HTTP ${vertResponse.status} ${vertResponse.statusText}`;
        }
        console.error('Vert payment creation failed:', errorText);
        throw new Error(`Payment creation failed (${vertResponse.status}): ${errorText}`);
      }

      let vertData;
      try {
        vertData = await vertResponse.json();
      } catch (parseError) {
        console.error('Error parsing Vert response:', parseError);
        const responseText = await vertResponse.text();
        console.error('Raw response:', responseText);
        throw new Error('Invalid response from payment system. Please try again.');
      }
      
      console.log('Vert payment response:', vertData);

      if (!vertData.success) {
        console.error('Error creating Vert payment:', vertData);
        toast({
          title: "Payment Setup Error", 
          description: vertData?.error || vertData?.message || "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Vert payment page
      const paymentUrl = vertData.paymentUrl || vertData.payment_url || vertData.url;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No payment URL received from Vert');
      }

      toast({
        title: "Payment Session Created",
        description: "You've been redirected to complete your secure payment.",
      });

      // Close the dialog and reset form
      setIsOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error submitting deposit:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to create deposit request. Please try again.";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message.includes('CORS')) {
        errorMessage = "Connection error. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
        >
          Make a Deposit 💰
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-center text-casino-gold">Make a Deposit</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            Enter your details to make a secure deposit. All fields are required.
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

            {/* Security Information */}
            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                <h4 className="text-sm sm:text-base font-medium">Secure Payment Information:</h4>
              </div>
              <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Your payment is processed securely</li>
                <li>We never store your payment information</li>
                <li>All transactions are encrypted and secure</li>
                <li>You'll receive an email confirmation after payment</li>
              </ul>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border border-green-500/30 touch-manipulation" 
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
                  Continue to Secure Payment
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};