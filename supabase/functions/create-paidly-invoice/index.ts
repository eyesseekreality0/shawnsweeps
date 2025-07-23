import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateInvoiceRequest {
  amount: number;
  currency: string;
  customerEmail: string;
  description?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = "USD", customerEmail, description, metadata } = await req.json() as CreateInvoiceRequest;

    // Get environment variables
    const paidlyApiKey = Deno.env.get("PAIDLY_API_KEY");
    const paidlyStoreId = Deno.env.get("PAIDLY_STORE_ID");
    const paidlyBaseUrl = "https://api-staging.paidlyinteractive.com";

    console.log("Paidly API Key exists:", !!paidlyApiKey);
    console.log("Paidly Store ID exists:", !!paidlyStoreId);
    console.log("Store ID value:", paidlyStoreId);

    if (!paidlyApiKey || !paidlyStoreId) {
      throw new Error("Missing Paidly credentials. Please configure PAIDLY_API_KEY and PAIDLY_STORE_ID in Supabase Edge Function secrets.");
    }

    // Prepare the request body according to Paidly API spec
    const requestBody = {
      amount: amount,
      currency: currency,
      checkout: {
        defaultPaymentMethod: "BTC_LightningLike",
        redirectAutomatically: false,
        expirationMinutes: 60, // Changed from expiration to expirationMinutes
      },
      metadata: {
        customerEmail,
        description: description || "Casino Deposit",
        ...metadata,
      },
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Create invoice with Paidly Interactive - try different auth formats
    const invoiceResponse = await fetch(`${paidlyBaseUrl}/api/v1/stores/${paidlyStoreId}/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paidlyApiKey}`, // Changed from Token to Bearer
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Invoice response status:", invoiceResponse.status);
    console.log("Invoice response headers:", Object.fromEntries(invoiceResponse.headers.entries()));

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error("Paidly API error response:", errorText);
      
      // Try with different auth format if Bearer failed
      if (invoiceResponse.status === 401) {
        console.log("Trying alternative auth format...");
        const altResponse = await fetch(`${paidlyBaseUrl}/api/v1/stores/${paidlyStoreId}/invoices`, {
          method: "POST",
          headers: {
            "Authorization": `Token ${paidlyApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (altResponse.ok) {
          const invoiceData = await altResponse.json();
          console.log("Alternative auth successful, invoice data:", invoiceData);
          
          // Update the deposit record
          if (metadata?.depositId) {
            const supabaseService = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
              { auth: { persistSession: false } }
            );

            await supabaseService
              .from("deposits")
              .update({
                paidly_invoice_id: invoiceData.id,
                status: "pending_payment",
              })
              .eq("id", metadata.depositId);
          }

          return new Response(JSON.stringify({
            success: true,
            invoiceId: invoiceData.id,
            checkoutLink: invoiceData.checkoutLink,
            amount: invoiceData.amount,
            currency: invoiceData.currency,
            status: invoiceData.status,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          const altErrorText = await altResponse.text();
          console.error("Alternative auth also failed:", altErrorText);
        }
      }
      
      throw new Error(`Failed to create invoice: ${invoiceResponse.status} - ${errorText}`);
    }

    const invoiceData = await invoiceResponse.json();
    console.log("Invoice created successfully:", invoiceData);

    // Update the deposit record in Supabase with the invoice ID
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (metadata?.depositId) {
      await supabaseService
        .from("deposits")
        .update({
          paidly_invoice_id: invoiceData.id,
          status: "pending_payment",
        })
        .eq("id", metadata.depositId);
    }

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceData.id,
      checkoutLink: invoiceData.checkoutLink,
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      status: invoiceData.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating Paidly invoice:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});