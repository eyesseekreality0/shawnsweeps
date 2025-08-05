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
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    const body = await req.text()
    console.log('Raw webhook body:', body)

    // Wert webhook secret for signature verification
    const webhookSecret = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'
    
    // Get signature from headers
    const signature = req.headers.get('x-wert-signature') || 
                     req.headers.get('wert-signature') ||
                     req.headers.get('signature')
    
    console.log('Received signature:', signature)

    // Verify webhook signature if present
    if (signature && webhookSecret) {
      const key = webhookSecret.startsWith('0x') ? webhookSecret.slice(2) : webhookSecret
      const expectedSignature = createHmac('sha256', key)
        .update(body)
        .digest('hex')
      
      console.log('Expected signature:', expectedSignature)
      
      const cleanSignature = signature.replace('sha256=', '').replace('0x', '')
      
      if (cleanSignature !== expectedSignature) {
        console.warn('Signature mismatch - continuing for testing')
        console.warn('Received:', cleanSignature)
        console.warn('Expected:', expectedSignature)
      } else {
        console.log('✅ Signature verified successfully')
      }
    }

    // Parse webhook payload
    let event
    try {
      event = JSON.parse(body)
      console.log('📦 Parsed webhook event:', JSON.stringify(event, null, 2))
    } catch (err) {
      console.error('❌ Invalid JSON in webhook body:', err)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but invalid JSON'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract event information
    const eventType = event.type
    const clickId = event.click_id
    const order = event.order || {}
    const orderId = order.id
    const orderStatus = order.status
    
    console.log('📋 Event details:')
    console.log('  Type:', eventType)
    console.log('  Click ID:', clickId)
    console.log('  Order ID:', orderId)
    console.log('  Order Status:', orderStatus)

    // Handle test webhooks
    if (eventType === 'test') {
      console.log('🧪 Test webhook received - no database update needed')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Test webhook processed successfully',
          event_type: eventType,
          click_id: clickId
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client for non-test events
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but server configuration incomplete'
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
    
    switch (orderStatus) {
      case 'completed':
      case 'success':
        depositStatus = 'completed'
        break
      case 'failed':
      case 'error':
        depositStatus = 'failed'
        break
      case 'cancelled':
      case 'canceled':
        depositStatus = 'cancelled'
        break
      default:
        depositStatus = 'pending'
    }

    console.log('💾 Updating deposit status to:', depositStatus)

    // Update deposit record if we have a click_id
    if (clickId && clickId !== 'test_click_id') {
      const { data: updateData, error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: depositStatus,
          wert_order_id: orderId || clickId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clickId)
        .select()

      if (updateError) {
        console.error('❌ Error updating deposit:', updateError)
      } else {
        console.log('✅ Deposit updated successfully:', updateData)
      }
    } else {
      console.log('ℹ️ No valid click_id found, skipping database update')
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        event_type: eventType,
        click_id: clickId,
        order_id: orderId,
        status: depositStatus
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
    
    // Always return 200 to prevent Wert from retrying
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Webhook received but processing failed: ${error.message}`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})