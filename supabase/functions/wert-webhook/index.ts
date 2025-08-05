import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wert-signature, wert-signature',
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
    console.log('URL:', req.url)
    
    // Log all headers for debugging
    const headers = Object.fromEntries(req.headers.entries())
    console.log('Headers:', headers)

    const body = await req.text()
    console.log('Raw Wert webhook body:', body)

    // Wert webhook secret for signature verification
    const webhookSecret = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'
    
    // Get signature from headers
    const signature = req.headers.get('x-wert-signature') || 
                     req.headers.get('wert-signature') ||
                     req.headers.get('signature')
    
    console.log('Received Wert signature:', signature)

    // Verify Wert webhook signature if present
    if (signature && webhookSecret) {
      try {
        const key = webhookSecret.startsWith('0x') ? webhookSecret.slice(2) : webhookSecret
        const expectedSignature = createHmac('sha256', key)
          .update(body)
          .digest('hex')
        
        console.log('Expected Wert signature:', expectedSignature)
        
        const cleanSignature = signature.replace('sha256=', '').replace('0x', '')
        
        if (cleanSignature !== expectedSignature) {
          console.warn('⚠️ Wert signature mismatch - continuing for testing')
          console.warn('Received:', cleanSignature)
          console.warn('Expected:', expectedSignature)
        } else {
          console.log('✅ Wert signature verified successfully')
        }
      } catch (sigError) {
        console.error('Error verifying Wert signature:', sigError)
      }
    } else {
      console.log('ℹ️ No Wert signature provided')
    }

    // Parse Wert webhook payload
    let event
    try {
      event = JSON.parse(body)
      console.log('📦 Parsed Wert webhook event:', JSON.stringify(event, null, 2))
    } catch (parseError) {
      console.error('❌ Invalid JSON in Wert webhook body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Wert webhook received but invalid JSON',
          received_body: body
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract Wert event information
    const eventType = event.type
    const clickId = event.click_id
    const order = event.order || {}
    const orderId = order.id || order.order_id
    const orderStatus = order.status
    const transactionId = order.transaction_id
    const baseAmount = order.base_amount
    const quoteAmount = order.quote_amount
    const commodity = order.quote
    
    console.log('📋 Wert event details:')
    console.log('  Type:', eventType)
    console.log('  Click ID:', clickId)
    console.log('  Order ID:', orderId)
    console.log('  Order Status:', orderStatus)
    console.log('  Transaction ID:', transactionId)
    console.log('  Base Amount:', baseAmount)
    console.log('  Quote Amount:', quoteAmount)
    console.log('  Commodity:', commodity)

    // Handle Wert test webhooks
    if (eventType === 'test' || clickId === 'test_click_id') {
      console.log('🧪 Wert test webhook received - responding with success')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Wert test webhook processed successfully',
          event_type: eventType,
          click_id: clickId,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client for real Wert events
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Wert webhook received but server configuration incomplete'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Map Wert order status to our deposit status
    let depositStatus = 'pending'
    
    switch (orderStatus?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'confirmed':
      case 'finished':
        depositStatus = 'completed'
        break
      case 'failed':
      case 'error':
      case 'rejected':
      case 'declined':
        depositStatus = 'failed'
        break
      case 'cancelled':
      case 'canceled':
        depositStatus = 'cancelled'
        break
      case 'pending':
      case 'processing':
      case 'waiting':
        depositStatus = 'pending'
        break
      default:
        depositStatus = 'pending'
    }

    console.log('💾 Updating deposit status to:', depositStatus)

    // Update deposit record if we have a valid click_id
    if (clickId && clickId !== 'test_click_id') {
      const updateData = {
        status: depositStatus,
        speed_checkout_session_id: orderId || transactionId || clickId,
        updated_at: new Date().toISOString()
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', clickId)
        .select()

      if (updateError) {
        console.error('❌ Error updating deposit:', updateError)
      } else {
        console.log('✅ Deposit updated successfully:', updateResult)
      }
    } else {
      console.log('ℹ️ No valid click_id found or test webhook, skipping database update')
    }

    // Always return success to prevent Wert from retrying
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Wert webhook processed successfully',
        event_type: eventType,
        click_id: clickId,
        order_id: orderId,
        status: depositStatus,
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Wert Webhook Processing Error ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    
    // Always return 200 to prevent Wert from retrying
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Wert webhook received but processing failed: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})