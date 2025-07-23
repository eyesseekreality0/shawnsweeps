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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const depositSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  gameName: z.string().min(1, "Game name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a valid number greater than 0"),
  paymentMethod: z.enum(["bitcoin", "lightning"], {
    required_error: "Please select a payment method",
  }),
});

type DepositFormData = z.infer<typeof depositSchema>;

export const DepositForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      gameName: "",
      amount: "",
      paymentMethod: "bitcoin" as const,
    },
  });

  const onSubmit = async (data: DepositFormData) => {
    setIsSubmitting(true);
    try {
      // First, create the deposit record
      const { data: depositData, error: depositError } = await supabase
        .from("deposits")
        .insert({
          username: data.username,
          email: data.email,
          phone: data.phone,
          game_name: data.gameName,
          amount: parseFloat(data.amount),
          status: "pending",
          user_id: null,
        })
        .select()
        .single();

      if (depositError) {
        throw depositError;
      }

      // Create Paidly invoice
      const { data: invoiceResponse, error: invoiceError } = await supabase.functions.invoke('create-paidly-invoice', {
        body: {
          amount: parseFloat(data.amount),
          currency: "USD",
          customerEmail: data.email,
          description: `Casino deposit for ${data.gameName}`,
          metadata: {
            depositId: depositData.id,
            username: data.username,
            gameName: data.gameName,
            paymentMethod: data.paymentMethod,
          },
        },
      });

      if (invoiceError) {
        throw new Error(invoiceError.message || "Failed to create payment invoice");
      }

      if (!invoiceResponse.success) {
        throw new Error(invoiceResponse.error || "Failed to create payment invoice");
      }

      // Redirect to Paidly checkout
      window.open(invoiceResponse.checkoutLink, '_blank');

      toast({
        title: "Payment Created",
        description: "Redirecting to payment page. Complete your Bitcoin payment to finalize the deposit.",
      });

      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit deposit request. Please try again.",
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
          className="text-lg px-8 py-6 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          Make a Deposit 💰
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-casino-gold">Make a Deposit</DialogTitle>
          <DialogDescription className="text-center">
            Enter your details to make a deposit. All fields are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter your phone number" {...field} />
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
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the game name" {...field} />
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
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="Enter deposit amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bitcoin" id="bitcoin" />
                        <label
                          htmlFor="bitcoin"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Bitcoin (On-chain)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lightning" id="lightning" />
                        <label
                          htmlFor="lightning"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Lightning Network (Instant)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Submit Deposit Request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};