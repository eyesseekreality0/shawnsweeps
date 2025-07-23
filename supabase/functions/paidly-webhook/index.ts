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
    await supabase
      .from('webhook_logs')
      .insert({
        provider: 'paidly',
        event_type: payload.event_type || payload.type || 'unknown',
        invoice_id: payload.invoice_id || payload.id,
        payload: payload,
        status: payload.status
      })

    // Handle different event types
    if (payload.event_type === 'invoice.paid' || payload.status === 'paid' || payload.status === 'settled' || payload.status === 'confirmed') {
      // Payment was successful
      const depositId = payload.metadata?.deposit_id || payload.deposit_id

      if (depositId) {
        const { error } = await supabase
          .from('deposits')
          .update({ 
            status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', depositId)

        if (error) {
          console.error('Error updating deposit status:', error)
        } else {
          console.log('Deposit marked as completed:', depositId)
        }
      }
    } else if (payload.event_type === 'invoice.expired' || payload.status === 'expired' || payload.status === 'cancelled') {
      // Payment failed or expired
      const depositId = payload.metadata?.deposit_id || payload.deposit_id

      if (depositId) {
        const { error } = await supabase
          .from('deposits')
          .update({ status: 'failed' })
          .eq('id', depositId)

        if (error) {
          console.error('Error updating deposit status:', error)
        } else {
          console.log('Deposit marked as failed:', depositId)
        }
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