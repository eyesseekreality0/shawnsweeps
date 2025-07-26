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

    // Create checkout session with Speed API
    const speedResponse = await fetch('https://api.tryspeed.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(speedApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency.toUpperCase(),
        description: description,
        customer_email: customerEmail,
        target_currency: 'SATS', // Convert to Bitcoin/Lightning
        payment_methods: [metadata.paymentMethod === 'lightning' ? 'lightning' : 'on_chain'],
        success_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/speed-webhook`,
        cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/speed-webhook`,
        metadata: {
          deposit_id: metadata.depositId,
          username: metadata.username,
          game_name: metadata.gameName,
        }
      })
    })

    const speedData = await speedResponse.text()
    console.log('Speed API response status:', speedResponse.status)
    console.log('Speed API response:', speedData)

    if (!speedResponse.ok) {
      console.error('Speed API error:', speedData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create checkout session: ${speedResponse.status} - ${speedData}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const checkoutData = JSON.parse(speedData)
    console.log('Checkout session created successfully:', checkoutData)

    // Update the deposit record with the checkout session ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        speed_checkout_session_id: checkoutData.id,
        status: 'pending_payment' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout: checkoutData,
        paymentUrl: checkoutData.url
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