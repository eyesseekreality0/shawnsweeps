import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

interface PaidlyWebhookEvent {
  type: string;
  data: {
    invoiceId: string;
    storeId: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, any>;
    paymentMethod?: string;
    paidAt?: string;
    expiredAt?: string;
  };
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received webhook request:", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse the webhook payload
    const webhookEvent: PaidlyWebhookEvent = await req.json();
    console.log("Webhook event received:", JSON.stringify(webhookEvent, null, 2));

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract invoice ID and find corresponding deposit
    const { invoiceId, status, metadata, paidAt, expiredAt } = webhookEvent.data;

    console.log("Looking for deposit with Paidly invoice ID:", invoiceId);

    // Find the deposit record by paidly_invoice_id
    const { data: deposit, error: findError } = await supabase
      .from("deposits")
      .select("*")
      .eq("paidly_invoice_id", invoiceId)
      .single();

    if (findError) {
      console.error("Error finding deposit:", findError);
      return new Response(JSON.stringify({
        success: false,
        error: "Deposit not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Found deposit:", deposit);

    // Map Paidly status to our status
    let newStatus = "pending";
    switch (status.toLowerCase()) {
      case "settled":
      case "paid":
      case "confirmed":
        newStatus = "completed";
        break;
      case "expired":
      case "cancelled":
        newStatus = "failed";
        break;
      case "pending":
      case "processing":
        newStatus = "pending_payment";
        break;
      default:
        newStatus = "pending";
    }

    // Update the deposit status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add payment timestamp if available
    if (paidAt) {
      updateData.paid_at = paidAt;
    }

    console.log("Updating deposit with:", updateData);

    const { data: updatedDeposit, error: updateError } = await supabase
      .from("deposits")
      .update(updateData)
      .eq("id", deposit.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating deposit:", updateError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to update deposit"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Deposit updated successfully:", updatedDeposit);

    // Log the webhook event for debugging
    const { error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "paidly",
        event_type: webhookEvent.type,
        invoice_id: invoiceId,
        deposit_id: deposit.id,
        payload: webhookEvent,
        processed_at: new Date().toISOString(),
        status: newStatus,
      });

    if (logError) {
      console.warn("Failed to log webhook event:", logError);
      // Continue processing even if logging fails
    }

    // Return success response to Paidly
    return new Response(JSON.stringify({
      success: true,
      message: "Webhook processed successfully",
      depositId: deposit.id,
      newStatus: newStatus,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});