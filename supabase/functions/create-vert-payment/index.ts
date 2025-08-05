import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
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

Deno.serve(async (req) => {
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
      amount: amount, // Vert expects dollar amount, not cents
      currency: currency.toUpperCase(),
      customer_email: customerEmail,
      description: description,
      metadata: {
        deposit_id: metadata.depositId,
        username: metadata.username,
        game_name: metadata.gameName,
      },
      return_url: `${req.headers.get('origin') || 'https://vbeirjdjfvmtwkljscwb.supabase.co'}`,
    }

    console.log('Sending request to Vert API with payload:', vertPayload)

    const vertApiUrl = 'https://api.vert.co/v1/payment-sessions';
    console.log('Calling Vert API at:', vertApiUrl);
    
    const vertResponse = await fetch(vertApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vertApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(vertPayload)
    })

    const vertData = await vertResponse.text()
    console.log('Vert API response status:', vertResponse.status)
    console.log('Vert API response headers:', Object.fromEntries(vertResponse.headers.entries()))
    console.log('Vert API response body:', vertData)

    if (!vertResponse.ok) {
      console.error('Vert API error details:')
      console.error('Status:', vertResponse.status)
      console.error('StatusText:', vertResponse.statusText)
      console.error('Response:', vertData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payment system error (${vertResponse.status}): ${vertResponse.statusText}. Please try again or contact support.`,
          details: {
            status: vertResponse.status,
            statusText: vertResponse.statusText,
            body: vertData,
            url: vertApiUrl
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let paymentSession
    try {
      paymentSession = JSON.parse(vertData)
    } catch (parseError) {
      console.error('Error parsing Vert response:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from payment system. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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
        status: 'pending' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
      // Don't fail the entire request if database update fails
      // The payment session was created successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: paymentSession.payment_url || paymentSession.checkout_url || paymentSession.url,
        paymentId: paymentSession.id,
        amount: amount,
        currency: currency,
        session: paymentSession
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Vert payment:', error)
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Network connection error. Please check your internet connection and try again.',
          type: 'network_error'
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}`,
        type: 'server_error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})