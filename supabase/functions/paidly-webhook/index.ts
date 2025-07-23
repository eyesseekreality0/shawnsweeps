import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Received Paidly webhook:', JSON.stringify(payload, null, 2))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: payload.event || payload.event_type || payload.type || 'unknown',
        payload: payload
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Process the webhook based on event type
    const eventType = payload.event || payload.event_type
    const invoiceId = payload.invoice?.id || payload.id
    const status = payload.status || payload.invoice?.status

    console.log('Processing event:', eventType, 'for invoice:', invoiceId, 'with status:', status)

    // Update deposit status based on payment events
    if (eventType === 'invoice.paid' || status === 'paid' || status === 'settled' || status === 'confirmed') {
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ status: 'completed' })
        .eq('paidly_invoice_id', invoiceId)

      if (updateError) {
        console.error('Error updating deposit to completed:', updateError)
      } else {
        console.log('Deposit marked as completed for invoice:', invoiceId)
      }
    } else if (eventType === 'invoice.expired' || status === 'expired' || status === 'cancelled') {
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ status: 'failed' })
        .eq('paidly_invoice_id', invoiceId)

      if (updateError) {
        console.error('Error updating deposit to failed:', updateError)
      } else {
        console.log('Deposit marked as failed for invoice:', invoiceId)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing Paidly webhook:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})