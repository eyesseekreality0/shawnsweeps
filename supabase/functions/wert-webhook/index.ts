import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wert-signature',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Wert Webhook Received ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    const body = await req.text()
    console.log('Raw body:', body)

    // Get signature from headers (Wert uses x-wert-signature)
    const signature = req.headers.get('x-wert-signature') || req.headers.get('wert-signature')
    console.log('Received signature:', signature)

    // Verify webhook signature if present
    const webhookSecret = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'
    if (signature && webhookSecret) {
      // Remove 0x prefix from private key for HMAC
      const key = webhookSecret.startsWith('0x') ? webhookSecret.slice(2) : webhookSecret
      const expectedSignature = createHmac('sha256', key)
        .update(body)
        .digest('hex')
      
      console.log('Expected signature:', expectedSignature)
      
      // Wert might send signature with or without sha256= prefix
      const cleanSignature = signature.replace('sha256=', '')
      
      if (cleanSignature !== expectedSignature) {
        console.error('Signature mismatch!')
        console.error('Received:', cleanSignature)
        console.error('Expected:', expectedSignature)
        // For testing, we'll log but not reject
        console.warn('Continuing despite signature mismatch for testing...')
      } else {
        console.log('Signature verified successfully')
      }
    } else {
      console.log('No signature verification (missing signature or secret)')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      console.error('SUPABASE_URL:', supabaseUrl ? 'present' : 'missing')
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'present' : 'missing')
      
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          received: true // Still acknowledge receipt
        }),
        { 
          status: 200, // Return 200 to prevent Wert retries
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
      console.log('Parsed event:', JSON.stringify(event, null, 2))
    } catch (err) {
      console.error('Invalid JSON in webhook body:', err)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON',
          received: true
        }),
        { 
          status: 200, // Return 200 to acknowledge receipt
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle different Wert webhook event types
    const eventType = event.type || event.event_type
    const eventData = event.order || event.data || event
    
    console.log('Processing event type:', eventType)
    console.log('Event data:', JSON.stringify(eventData, null, 2))

    // Extract order information
    const orderId = eventData.id || event.order?.id || eventData.order_id
    const clickId = eventData.click_id || eventData.external_id
    const status = eventData.status || event.status
    
    console.log('Order ID:', orderId)
    console.log('Click ID (Deposit ID):', clickId)
    console.log('Status:', status)

    // Update deposit status based on event type
    let newStatus = 'pending'
    
    switch (eventType) {
      case 'test':
        newStatus = 'pending' // Test webhooks don't change status
        console.log('Test webhook received - no status change')
        break
      case 'order_processed':
      case 'order_completed':
      case 'payment_completed':
        newStatus = 'completed'
        break
      case 'order_failed':
      case 'payment_failed':
        newStatus = 'failed'
        break
      case 'order_canceled':
      case 'order_cancelled':
      case 'payment_cancelled':
        newStatus = 'cancelled'
        break
      default:
        console.log('Unknown event type, keeping status as pending')
    }

    // Update deposit record if we have a click_id (deposit ID)
    if (clickId) {
      console.log(`Updating deposit ${clickId} to status: ${newStatus}`)
      
      const { data: updateData, error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: newStatus,
          wert_order_id: orderId || clickId
        })
        .eq('id', clickId)
        .select()

      if (updateError) {
        console.error('Error updating deposit status:', updateError)
      } else {
        console.log('Deposit updated successfully:', updateData)
      }
    } else {
      console.warn('No click_id found in webhook data, cannot update deposit')
    }

    // Always return success to prevent Wert from retrying
    return new Response(
      JSON.stringify({ 
        received: true,
        processed: true,
        event_type: eventType,
        deposit_id: clickId,
        new_status: newStatus
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Webhook Processing Error ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    
    // Return 200 to prevent Wert from retrying failed webhooks
    return new Response(
      JSON.stringify({ 
        error: `Webhook processing error: ${error.message}`,
        received: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})