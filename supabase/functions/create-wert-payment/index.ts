import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface WertPaymentRequest {
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
    console.log('=== Wert Payment Function Started ===')
    
    // Parse request body with error handling
    let requestData: WertPaymentRequest
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body - must be valid JSON',
          type: 'parse_error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { amount, currency, customerEmail, description, metadata } = requestData

    console.log('Creating Wert payment with data:', { amount, currency, customerEmail, description, metadata })

    // Wert.io API credentials from environment
    const wertApiKey = Deno.env.get('WERT_API_KEY')
    const wertPartnerId = Deno.env.get('WERT_PARTNER_ID')
    
    if (!wertApiKey || !wertPartnerId) {
      console.error('Missing Wert.io credentials')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Wert.io credentials not configured',
          type: 'config_error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Wert.io order payload
    const wertPayload = {
      partner_id: wertPartnerId,
      click_id: metadata.depositId, // Use deposit ID as click_id for tracking
      origin: 'https://widget.wert.io',
      commodity: 'USD',
      commodity_amount: amount,
      pk_id: 'key1',
      sc_address: customerEmail, // Use email as smart contract address placeholder
      sc_input_data: JSON.stringify({
        username: metadata.username,
        game_name: metadata.gameName,
        deposit_id: metadata.depositId
      })
    }

    console.log('Sending request to Wert.io API with payload:', wertPayload)

    // Try Wert.io Data API endpoint
    const wertResponse = await fetch('https://api.wert.io/v3/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wertApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(wertPayload)
    })

    console.log('Wert.io API response status:', wertResponse.status)
    
    const responseText = await wertResponse.text()
    console.log('Wert.io API response body:', responseText)

    if (!wertResponse.ok) {
      console.error('Wert.io API error:', wertResponse.status, responseText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Wert.io API error (${wertResponse.status}): ${responseText}`,
          details: { status: wertResponse.status, body: responseText },
          type: 'api_error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let wertData
    try {
      wertData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parsing Wert.io response:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from Wert.io API',
          details: { responseText },
          type: 'parse_error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Wert.io order created:', wertData)

    // Update deposit record with Wert.io order ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const orderId = wertData.id || wertData.order_id
    if (orderId) {
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          wert_order_id: orderId,
          status: 'pending' 
        })
        .eq('id', metadata.depositId)

      if (updateError) {
        console.error('Error updating deposit with Wert order ID:', updateError)
      } else {
        console.log('Deposit updated with Wert order ID:', orderId)
      }
    }

    // Get payment URL from Wert.io response
    const paymentUrl = wertData.redirect_url || 
                      wertData.payment_url || 
                      wertData.checkout_url || 
                      wertData.url ||
                      `https://widget.wert.io/01DPAPQX2Q0MFWKMTQHP9WB4N7/widget?theme=dark&color_buttons=01D4AA&color_secondary=344152&color_main=FFFFFF&color_icons=01D4AA&commodity=USD&commodity_amount=${amount}&click_id=${metadata.depositId}`

    if (!paymentUrl) {
      console.error('No payment URL in Wert.io response:', wertData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No payment URL received from Wert.io',
          wertResponse: wertData,
          type: 'url_error'
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
        orderId: orderId,
        amount: amount,
        currency: currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Wert Payment Function Error ===')
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