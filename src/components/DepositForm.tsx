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
import { createPayment } from "@/lib/wert";

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

      // Create payment session
      console.log('Creating payment for deposit:', depositData.id);
      
      const paymentResponse = await createPayment({
        amount: parseFloat(data.amount),
        currency: 'USD',
        customerEmail: data.email,
        description: `Shawn Sweepstakes - ${data.gameName} deposit`,
        metadata: {
          depositId: depositData.id,
          username: data.username,
          gameName: data.gameName
        }
      });

      console.log('Payment response:', paymentResponse);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to create payment session');
      }

      // Redirect to payment page
      const paymentUrl = paymentResponse.paymentUrl;
      if (paymentUrl) {
        console.log('Redirecting to payment URL:', paymentUrl);
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No payment URL received from payment system');
      }

      toast({
        title: "Processing Deposit",
        description: "Opening secure payment page...",
      });

      // Close the dialog and reset form
      setIsOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error submitting deposit:", error);
      
      let errorMessage = "Failed to process deposit. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Deposit Error",
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
          className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white border border-blue-500/30 shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
        >
          💳 Make a Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-center text-casino-gold">Secure Deposit</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            Secure deposit - Buy crypto with your card and deposit instantly. All fields are required.
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
                <h4 className="text-sm sm:text-base font-medium">Secure Crypto Purchase:</h4>
              </div>
              <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Buy crypto instantly with your debit/credit card</li>
                <li>Bank-level encryption and security</li>
                <li>KYC/AML compliant and regulated</li>
                <li>Instant deposit processing</li>
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
                  Processing Deposit...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Make Deposit
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};