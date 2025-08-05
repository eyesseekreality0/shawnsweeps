import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, vert-signature',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('vert-signature')
    
    console.log('Vert webhook received')
    console.log('Signature:', signature)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
    } catch (err) {
      console.error('Invalid JSON in webhook body:', err)
      return new Response('Invalid JSON', { status: 400 })
    }

    console.log('Vert webhook event type:', event.type)
    console.log('Vert webhook event data:', event.data)

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: event.type,
        payload: event,
        source: 'vert'
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Process the webhook based on event type
    if (event.type === 'payment.completed' || event.type === 'payment_session.completed') {
      const payment = event.data.object || event.data
      const paymentId = payment.id
      
      if (paymentId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'completed' })
          .eq('vert_payment_id', paymentId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as completed for payment:', paymentId)
        }
      }
    } else if (event.type === 'payment.failed' || event.type === 'payment_session.failed') {
      const payment = event.data.object || event.data
      const paymentId = payment.id
      
      if (paymentId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'failed' })
          .eq('vert_payment_id', paymentId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as failed for payment:', paymentId)
        }
      }
    } else if (event.type === 'payment.cancelled' || event.type === 'payment_session.cancelled') {
      const payment = event.data.object || event.data
      const paymentId = payment.id
      
      if (paymentId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'cancelled' })
          .eq('vert_payment_id', paymentId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as cancelled for payment:', paymentId)
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing Vert webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: `Webhook processing error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})