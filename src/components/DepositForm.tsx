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
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [paymentAddressId, setPaymentAddressId] = useState<string>('');
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
      // Create payment address via Paidly Interactive API
      const { data: paidlyData, error: paidlyError } = await supabase.functions.invoke('create-paidly-checkout', {
        body: {
          amount: amount,
          currency: 'USD',
          customerEmail: customerEmail,
          description: `Casino deposit for ${gameName}`,
          metadata: {
            depositId: depositId,
            username: username,
            gameName: gameName,
            paymentMethod: method
          }
        }
      });

      if (paidlyError || !paidlyData.success) {
        console.error('Error creating Paidly checkout session:', paidlyError, paidlyData);
        console.error('Full paidly response:', paidlyData);
        return null;
      }

      const address = paidlyData.paymentAddress;
      const link = paidlyData.checkoutUrl;
      const addressId = paidlyData.paymentAddressId;
      
      // Generate QR code for the payment link (Paidly checkout page)
      const qrUrl = await QRCode.toDataURL(link, {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 8,
        width: 256
      });
      
      return { address, link, addressId, qrUrl };
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
          description: "Failed to create TrySpeed payment address. Check console for details.",
          variant: "destructive",
        });
        return;
      }

      // Set the payment data for display
      setQrCodeUrl(paymentInfo.qrUrl);
      setPaymentAddress(paymentInfo.address);
      setPaymentLink(paymentInfo.link);
      setPaymentAddressId(paymentInfo.addressId);
      setPaymentAmount(parseFloat(data.amount));

      // Show the payment interface
      setShowPayment(true);

      toast({
        title: "Paidly Deposit Created",
        description: "Scan the QR code below with your Bitcoin wallet to complete payment via Paidly Interactive.",
      });

    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast({
        title: "Error",
        description: "Failed to create Paidly deposit request. Please try again.",
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
    setPaymentLink('');
    setPaymentAddressId('');
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
                Enter your details to make a deposit. All fields are required.
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
                
                <div className="space-y-2">
                  <FormLabel className="text-sm sm:text-base">Payment Method</FormLabel>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant={paymentMethod === 'bitcoin' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('bitcoin')}
                      className="flex items-center gap-2 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                    >
                      <Bitcoin className="w-4 h-4" />
                      Bitcoin
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'lightning' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('lightning')}
                      className="flex items-center gap-2 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                    >
                      <Zap className="w-4 h-4" />
                      Lightning
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-casino-gold border border-casino-gold/30 touch-manipulation" 
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
              <DialogTitle className="text-lg sm:text-2xl text-center text-casino-gold">
                Paidly Interactive Payment - {paymentMethod === 'bitcoin' ? 'Bitcoin' : 'Lightning'}
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Scan the QR code with your wallet or use the Paidly Interactive payment link
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-2 sm:p-4 bg-white rounded-lg">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment QR Code" 
                      className="w-48 h-48 sm:w-64 sm:h-64"
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
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Paidly Interactive {paymentMethod === 'bitcoin' ? 'Bitcoin On-Chain' : 'Lightning Network'}
                  </p>
                </div>
                
                {/* Payment Link Button */}
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(paymentLink, '_blank')}
                    className="w-full h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white touch-manipulation"
                    size="lg"
                  >
                    Pay with Paidly Interactive →
                  </Button>
                </div>
                
                {/* Address */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Paidly Interactive Payment Address:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={paymentAddress} 
                      readOnly 
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="shrink-0 h-9 sm:h-10 px-2 sm:px-3 touch-manipulation"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium mb-2">Paidly Interactive Payment Instructions:</h4>
                <ol className="text-xs sm:text-sm space-y-1 list-decimal list-inside">
                  <li>Open your Bitcoin wallet app</li>
                  <li>Scan the QR code above or copy the Paidly Interactive address</li>
                  <li>Send exactly ${paymentAmount.toFixed(2)} worth of Bitcoin</li>
                  <li>Paidly Interactive will process and your deposit will be credited automatically</li>
                </ol>
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