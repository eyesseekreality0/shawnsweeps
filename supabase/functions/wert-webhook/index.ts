import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, wert-signature',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('wert-signature')
    
    console.log('Webhook received')
    console.log('Signature:', signature)
    console.log('Body:', body)

    // Verify webhook signature
    const webhookSecret = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'
    if (webhookSecret && signature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('Invalid webhook signature')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
    } catch (err) {
      console.error('Invalid JSON in webhook body:', err)
      return new Response('Invalid JSON', { status: 400 })
    }

    console.log('Webhook event type:', event.type)
    console.log('Webhook event data:', event.data)

    // Process the webhook based on event type
    if (event.type === 'order_processed' || event.type === 'order.completed') {
      const order = event.data
      const orderId = order.id
      const clickId = order.click_id // This is our deposit ID
      
      if (clickId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'completed' })
          .eq('id', clickId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as completed for order:', orderId)
        }
      }
    } else if (event.type === 'order_failed' || event.type === 'order.failed') {
      const order = event.data
      const orderId = order.id
      const clickId = order.click_id
      
      if (clickId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'failed' })
          .eq('id', clickId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as failed for order:', orderId)
        }
      }
    } else if (event.type === 'order_canceled' || event.type === 'order.cancelled') {
      const order = event.data
      const orderId = order.id
      const clickId = order.click_id
      
      if (clickId) {
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ status: 'cancelled' })
          .eq('id', clickId)

        if (updateError) {
          console.error('Error updating deposit status:', updateError)
        } else {
          console.log('Deposit marked as cancelled for order:', orderId)
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
    console.error('Error processing webhook:', error)
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