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
    console.log('Speed webhook received:', webhookPayload)

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
        source: 'speed'
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Process the webhook based on event type
    if (webhookPayload.type === 'checkout_session.completed' || 
        webhookPayload.type === 'payment.succeeded') {
      
      const checkoutSessionId = webhookPayload.data?.object?.id || webhookPayload.data?.id
      const metadata = webhookPayload.data?.object?.metadata || webhookPayload.data?.metadata
      
      if (checkoutSessionId && metadata?.deposit_id) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'completed' })
          .eq('speed_checkout_session_id', checkoutSessionId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as completed for checkout session:', checkoutSessionId)
        }
      }
    } else if (webhookPayload.type === 'checkout_session.expired' || 
               webhookPayload.type === 'payment.failed') {
      
      const checkoutSessionId = webhookPayload.data?.object?.id || webhookPayload.data?.id
      
      if (checkoutSessionId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'failed' })
          .eq('speed_checkout_session_id', checkoutSessionId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as failed for checkout session:', checkoutSessionId)
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
    console.error('Error processing Speed webhook:', error)
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