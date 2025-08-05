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
    const webhookPayload = await req.json()
    console.log('Paidly Interactive webhook received:', webhookPayload)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: webhookPayload.type || 'unknown',
        payload: webhookPayload,
        source: 'paidly_interactive'
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Process the webhook based on event type
    if (webhookPayload.type === 'checkout.session.completed' || 
        webhookPayload.type === 'payment.succeeded' ||
        webhookPayload.type === 'payment.confirmed') {
      
      const sessionId = webhookPayload.data?.object?.id || webhookPayload.data?.id
      const metadata = webhookPayload.data?.object?.metadata || webhookPayload.data?.metadata
      
      if (sessionId && metadata?.deposit_id) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'completed' })
          .eq('paidly_interactive_checkout_session_id', sessionId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as completed for session:', sessionId)
        }
      }
    } else if (webhookPayload.type === 'checkout.session.expired' || 
               webhookPayload.type === 'payment.failed' ||
               webhookPayload.type === 'payment.cancelled') {
      
      const sessionId = webhookPayload.data?.object?.id || webhookPayload.data?.id
      
      if (sessionId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'failed' })
          .eq('paidly_interactive_checkout_session_id', sessionId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as failed for session:', sessionId)
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
    console.error('Error processing Paidly Interactive webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Webhook processing error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})