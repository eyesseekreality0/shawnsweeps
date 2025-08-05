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
    console.log('=== Vert Payment Function Started ===')
    
    // Parse request body
    const requestData: VertPaymentRequest = await req.json()
    const { amount, currency, customerEmail, description, metadata } = requestData

    console.log('Creating Vert payment with data:', { amount, currency, customerEmail, description, metadata })

    // Vert API credentials
    const vertApiKey = '776572742d70726f642d33343733656162352d653566312d343363352d626535312d616531336165643361643539'
    const vertPartnerId = '01K1T8VJJ8TY67M49FDXY865GF'
    
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
      return_url: `${req.headers.get('origin') || 'https://vbeirjdjfvmtwkljscwb.supabase.co'}/?payment=success`,
    }

    console.log('Sending request to Vert API with payload:', vertPayload)

    const vertResponse = await fetch('https://api.vert.co/v1/payment-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vertApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(vertPayload)
    })

    console.log('Vert API response status:', vertResponse.status)
    
    const responseText = await vertResponse.text()
    console.log('Vert API response body:', responseText)

    if (!vertResponse.ok) {
      console.error('Vert API error:', vertResponse.status, responseText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Vert API error (${vertResponse.status}): ${responseText}`,
          details: { status: vertResponse.status, body: responseText }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let vertData
    try {
      vertData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parsing Vert response:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from Vert API',
          details: { responseText }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Vert payment session created:', vertData)

    // Update deposit record with Vert payment ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const paymentId = vertData.id || vertData.payment_id || vertData.session_id
    if (paymentId) {
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          vert_payment_id: paymentId,
          status: 'pending' 
        })
        .eq('id', metadata.depositId)

      if (updateError) {
        console.error('Error updating deposit:', updateError)
      }
    }

    // Get payment URL
    const paymentUrl = vertData.payment_url || 
                      vertData.checkout_url || 
                      vertData.url || 
                      vertData.redirect_url

    if (!paymentUrl) {
      console.error('No payment URL in Vert response:', vertData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No payment URL received from Vert',
          vertResponse: vertData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: paymentUrl,
        paymentId: paymentId,
        amount: amount,
        currency: currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Vert Payment Function Error ===')
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}`,
        type: 'server_error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})