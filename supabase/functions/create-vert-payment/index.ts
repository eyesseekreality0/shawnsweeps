import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface VertPaymentRequest {
  amount: number
  currency: string
  customerEmail: string
  description: string
  metadata: {
    depositId: string
    username: string
    gameName: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, customerEmail, description, metadata }: VertPaymentRequest = await req.json()

    console.log('Creating Vert payment with data:', { amount, currency, customerEmail, description, metadata })

    // Vert API credentials
    const vertApiKey = '776572742d70726f642d33343733656162352d653566312d343363352d626535312d616531336165643361643539'
    const vertPartnerId = '01K1T8VJJ8TY67M49FDXY865GF'
    
    if (!vertApiKey || !vertPartnerId) {
      console.error('Vert API credentials not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment system configuration missing. Please contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Vert payment session
    const vertPayload = {
      partner_id: vertPartnerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toUpperCase(),
      customer_email: customerEmail,
      description: description,
      metadata: {
        deposit_id: metadata.depositId,
        username: metadata.username,
        game_name: metadata.gameName,
      },
      success_url: `${req.headers.get('origin')}/payment-success`,
      cancel_url: `${req.headers.get('origin')}/payment-cancelled`,
    }

    console.log('Sending request to Vert API with payload:', vertPayload)

    const vertResponse = await fetch('https://api.vert.com/v1/payment-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vertApiKey}`,
        'Content-Type': 'application/json',
        'Partner-ID': vertPartnerId,
      },
      body: JSON.stringify(vertPayload)
    })

    const vertData = await vertResponse.text()
    console.log('Vert API response status:', vertResponse.status)
    console.log('Vert API response body:', vertData)

    if (!vertResponse.ok) {
      console.error('Vert API error details:')
      console.error('Status:', vertResponse.status)
      console.error('StatusText:', vertResponse.statusText)
      console.error('Response:', vertData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Vert API error: ${vertResponse.status} - ${vertData}`,
          details: {
            status: vertResponse.status,
            statusText: vertResponse.statusText,
            body: vertData
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentSession = JSON.parse(vertData)
    console.log('Vert payment session created successfully:', paymentSession)

    // Update the deposit record with the payment session ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        vert_payment_id: paymentSession.id,
        status: 'pending_payment' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: paymentSession.payment_url,
        paymentId: paymentSession.id,
        amount: amount,
        currency: currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Vert payment:', error)
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