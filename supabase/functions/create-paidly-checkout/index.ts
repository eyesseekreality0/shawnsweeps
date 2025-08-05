import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaidlyCheckoutRequest {
  amount: number
  currency: string
  customerEmail: string
  description: string
  metadata: {
    depositId: string
    username: string
    gameName: string
    paymentMethod: 'lightning' | 'bitcoin'
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, customerEmail, description, metadata }: PaidlyCheckoutRequest = await req.json()

    console.log('Creating Paidly checkout session with data:', { amount, currency, customerEmail, description, metadata })

    // Paidly API credentials
    const paidlyPartnerId = '01K1T8VJJ8TY67M49FDXY865GF'
    const paidlyApiKey = '776572742d70726f642d33343733656162352d653566312d343363352d626535312d616531336165643361643539'

    console.log('Using Paidly Partner ID:', paidlyPartnerId)

    // Create Paidly checkout session
    const paidlyResponse = await fetch('https://api.paidly.io/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paidlyApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Partner-ID': paidlyPartnerId,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        description: description,
        customer_email: customerEmail,
        payment_methods: [metadata.paymentMethod === 'lightning' ? 'lightning' : 'bitcoin'],
        success_url: `${req.headers.get('origin') || 'https://your-domain.com'}/success`,
        cancel_url: `${req.headers.get('origin') || 'https://your-domain.com'}/cancel`,
        metadata: {
          deposit_id: metadata.depositId,
          username: metadata.username,
          game_name: metadata.gameName,
        }
      })
    })

    const paidlyData = await paidlyResponse.text()
    console.log('Paidly API response status:', paidlyResponse.status)
    console.log('Paidly API response headers:', Object.fromEntries(paidlyResponse.headers.entries()))
    console.log('Paidly API response body:', paidlyData)

    if (!paidlyResponse.ok) {
      console.error('Paidly API error details:')
      console.error('Status:', paidlyResponse.status)
      console.error('StatusText:', paidlyResponse.statusText)
      console.error('Response:', paidlyData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Paidly API error: ${paidlyResponse.status} - ${paidlyData}`,
          details: {
            status: paidlyResponse.status,
            statusText: paidlyResponse.statusText,
            body: paidlyData
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const checkoutData = JSON.parse(paidlyData)
    console.log('Paidly checkout session created successfully:', checkoutData)

    // Update the deposit record with the checkout session ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        paidly_checkout_session_id: checkoutData.id,
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
        checkoutUrl: checkoutData.url,
        paymentAddress: checkoutData.payment_address,
        paymentAddressId: checkoutData.id,
        qrCode: checkoutData.qr_code_url,
        amount: amount,
        paymentMethod: metadata.paymentMethod,
        checkoutSessionId: checkoutData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Paidly checkout session:', error)
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