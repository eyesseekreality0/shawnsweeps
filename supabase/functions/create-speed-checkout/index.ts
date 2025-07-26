import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpeedCheckoutRequest {
  amount: number
  currency: string
  customerEmail: string
  description: string
  metadata: {
    depositId: string
    username: string
    gameName: string
    paymentMethod: 'lightning' | 'on-chain'
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, customerEmail, description, metadata }: SpeedCheckoutRequest = await req.json()

    console.log('Creating Speed checkout session with data:', { amount, currency, customerEmail, description, metadata })

    // Get Speed API key from environment
    const speedApiKey = Deno.env.get('SPEED_API_KEY')

    if (!speedApiKey) {
      console.error('Missing Speed API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Speed API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create checkout session with Speed API - trying the correct endpoint
    const speedResponse = await fetch('https://api.tryspeed.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${speedApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency.toUpperCase(),
        description: description,
        customer_email: customerEmail,
        payment_methods: [metadata.paymentMethod === 'lightning' ? 'lightning' : 'on_chain'],
        metadata: {
          deposit_id: metadata.depositId,
          username: metadata.username,
          game_name: metadata.gameName,
        }
      })
    })

    const speedData = await speedResponse.text()
    console.log('Speed API response status:', speedResponse.status)
    console.log('Speed API response headers:', Object.fromEntries(speedResponse.headers.entries()))
    console.log('Speed API response body:', speedData)

    if (!speedResponse.ok) {
      console.error('Speed API error details:')
      console.error('Status:', speedResponse.status)
      console.error('StatusText:', speedResponse.statusText)
      console.error('Response:', speedData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `TrySpeed API error: ${speedResponse.status} - ${speedData}`,
          details: {
            status: speedResponse.status,
            statusText: speedResponse.statusText,
            body: speedData
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentData = JSON.parse(speedData)
    console.log('Payment address created successfully:', paymentData)

    // Update the deposit record with the checkout session ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        speed_checkout_session_id: paymentData.id,
        status: 'pending_payment' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
    }

     return new Response(
      JSON.stringify({ 
        success: true, 
        payment: paymentData,
        address: paymentData.payment_address || paymentData.address || paymentData.bitcoin_address || paymentData.lightning_address,
        qrCode: paymentData.qr_code || paymentData.qr_code_url,
        amount: amount,
        paymentMethod: metadata.paymentMethod,
        checkoutSessionId: paymentData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Speed checkout session:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})