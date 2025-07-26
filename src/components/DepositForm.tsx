import { useState, useEffect } from "react";
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
import { Bitcoin, Zap, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

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
  const [paymentMethod, setPaymentMethod] = useState<'bitcoin' | 'lightning'>('bitcoin');
  const [showPayment, setShowPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
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

  const generatePaymentQR = async (amount: number, method: 'bitcoin' | 'lightning', depositId: string, customerEmail: string, username: string, gameName: string) => {
    try {
      // Create payment address via Speed API
      const { data: speedData, error: speedError } = await supabase.functions.invoke('create-speed-checkout', {
        body: {
          amount: amount,
          currency: 'USD',
          customerEmail: customerEmail,
          description: `Casino deposit for ${gameName}`,
          metadata: {
            depositId: depositId,
            username: username,
            gameName: gameName,
            paymentMethod: method === 'bitcoin' ? 'on_chain' : 'lightning'
          }
        }
      });

      if (speedError || !speedData.success) {
        console.error('Error creating Speed payment address:', speedError, speedData);
        return null;
      }

      const address = speedData.address;
      const qrData = method === 'bitcoin' 
        ? `bitcoin:${address}?amount=${amount / 100000000}&label=Casino Deposit`
        : address;
      
      const qrUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 8,
        width: 256
      });
      
      return { address, qrUrl };
    } catch (error) {
      console.error('Error generating payment:', error);
      return null;
    }
  };

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

      // Generate payment address and QR code via TrySpeed
      const paymentInfo = await generatePaymentQR(
        parseFloat(data.amount), 
        paymentMethod, 
        depositData.id,
        data.email,
        data.username,
        data.gameName
      );
      
      if (!paymentInfo) {
        toast({
          title: "Payment Setup Error",
          description: "Failed to create TrySpeed payment address. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Set the payment data for display
      setQrCodeUrl(paymentInfo.qrUrl);
      setPaymentAddress(paymentInfo.address);
      setPaymentAmount(parseFloat(data.amount));

      // Show the payment interface
      setShowPayment(true);

      toast({
        title: "TrySpeed Deposit Created",
        description: "Scan the QR code below with your Bitcoin wallet to complete payment via TrySpeed.",
      });

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Payment address copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetForm = () => {
    setShowPayment(false);
    setQrCodeUrl('');
    setPaymentAddress('');
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
          className="text-lg px-8 py-6 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          Make a Deposit 💰
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!showPayment ? (
          <>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
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
                
                <div className="space-y-2">
                  <FormLabel>Payment Method</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'bitcoin' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('bitcoin')}
                      className="flex items-center gap-2"
                    >
                      <Bitcoin className="w-4 h-4" />
                      Bitcoin
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'lightning' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('lightning')}
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Lightning
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Make a Deposit"}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-casino-gold">
                TrySpeed Payment - {paymentMethod === 'bitcoin' ? 'Bitcoin' : 'Lightning'}
              </DialogTitle>
              <DialogDescription className="text-center">
                Scan the QR code with your wallet or copy the TrySpeed payment address
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment QR Code" 
                      className="w-64 h-64"
                    />
                  )}
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-casino-gold">
                    Amount: ${paymentAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    TrySpeed {paymentMethod === 'bitcoin' ? 'Bitcoin On-Chain' : 'Lightning Network'}
                  </p>
                </div>
                
                {/* Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">TrySpeed Payment Address:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={paymentAddress} 
                      readOnly 
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">TrySpeed Payment Instructions:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Open your Bitcoin wallet app</li>
                  <li>Scan the QR code above or copy the TrySpeed address</li>
                  <li>Send exactly ${paymentAmount.toFixed(2)} worth of Bitcoin</li>
                  <li>TrySpeed will process and your deposit will be credited automatically</li>
                </ol>
              </div>
              
              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full"
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