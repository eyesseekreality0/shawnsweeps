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
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // Parse request body with error handling
    let requestData: VertPaymentRequest
    try {
      const bodyText = await req.text()
      console.log('Raw request body:', bodyText)
      requestData = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request format. Please check your data and try again.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { amount, currency, customerEmail, description, metadata } = requestData

    console.log('Creating Vert payment with data:', { amount, currency, customerEmail, description, metadata })

    // Your actual Vert API credentials
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

    // Create Vert payment session with correct format
    const vertPayload = {
      partner_id: vertPartnerId,
      amount: Math.round(amount * 100), // Convert to cents for Vert
      currency: currency.toUpperCase(),
      customer_email: customerEmail,
      description: description,
      metadata: {
        deposit_id: metadata.depositId,
        username: metadata.username,
        game_name: metadata.gameName,
      },
      success_url: `${req.headers.get('origin') || 'https://vbeirjdjfvmtwkljscwb.supabase.co'}/?payment=success`,
      cancel_url: `${req.headers.get('origin') || 'https://vbeirjdjfvmtwkljscwb.supabase.co'}/?payment=cancelled`,
    }

    console.log('Sending request to Vert API with payload:', vertPayload)

    // Try multiple possible Vert API endpoints
    const possibleEndpoints = [
      'https://api.vert.co/v1/payment-sessions',
      'https://api.vert.co/payment-sessions',
      'https://vert.co/api/v1/payment-sessions',
      'https://checkout.vert.co/api/v1/payment-sessions'
    ]

    let vertResponse
    let vertData
    let lastError

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying Vert API endpoint: ${endpoint}`)
        
        vertResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vertApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Shawn-Sweepstakes/1.0',
          },
          body: JSON.stringify(vertPayload)
        })

        console.log(`Response from ${endpoint}:`, vertResponse.status, vertResponse.statusText)
        
        const responseText = await vertResponse.text()
        console.log(`Response body from ${endpoint}:`, responseText)

        if (vertResponse.ok) {
          try {
            vertData = JSON.parse(responseText)
            console.log('Successfully parsed Vert response:', vertData)
            break // Success, exit the loop
          } catch (parseError) {
            console.error(`Error parsing response from ${endpoint}:`, parseError)
            lastError = new Error(`Invalid JSON response from ${endpoint}`)
            continue
          }
        } else {
          lastError = new Error(`HTTP ${vertResponse.status} from ${endpoint}: ${responseText}`)
          continue
        }
      } catch (fetchError) {
        console.error(`Network error with ${endpoint}:`, fetchError)
        lastError = fetchError
        continue
      }
    }

    // If we didn't get a successful response from any endpoint
    if (!vertData) {
      console.error('All Vert API endpoints failed. Last error:', lastError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payment system unavailable. Error: ${lastError?.message || 'Unknown error'}`,
          details: {
            lastError: lastError?.message,
            endpoints: possibleEndpoints
          }
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Vert payment session created successfully:', vertData)

    // Update the deposit record with the payment session ID
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
        // Don't fail the entire request if database update fails
      }
    }

    // Extract payment URL from various possible response formats
    const paymentUrl = vertData.payment_url || 
                      vertData.checkout_url || 
                      vertData.url || 
                      vertData.redirect_url ||
                      vertData.hosted_url

    if (!paymentUrl) {
      console.error('No payment URL in Vert response:', vertData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment URL not provided by payment system. Please try again.',
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
        currency: currency,
        session: vertData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Vert Payment Function Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}`,
        type: 'server_error',
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})