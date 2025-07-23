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
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const depositSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number"),
  gameName: z.string().min(1, "Game name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a valid number greater than 0"),
});

type DepositFormData = z.infer<typeof depositSchema>;

export const DepositForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      phone: "",
      gameName: "",
      amount: "",
    },
  });

  const handleClick = () => {
    if (!user || !session) {
      navigate('/auth');
      return;
    }
    setIsOpen(true);
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a deposit request.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user profile to fetch username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          username: profile?.username || "Anonymous",
          email: user.email || "",
          phone: data.phone,
          game_name: data.gameName,
          amount: parseFloat(data.amount),
          status: "pending",
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted successfully. We'll process it shortly.",
      });

      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
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
          onClick={handleClick}
        >
          {user ? "Make a Deposit 💰" : "Sign In to Deposit 💰"}
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