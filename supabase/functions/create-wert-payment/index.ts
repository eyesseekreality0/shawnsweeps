import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface PaymentRequest {
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
    
    const requestData: PaymentRequest = await req.json()
    const { amount, customerEmail, metadata } = requestData

    console.log('Creating Wert payment with data:', { amount, customerEmail, metadata })

    // Wert.io sandbox credentials
    const partnerId = '01K0FHM9K6ATK1CYCHMV34Z0YG'
    const privateKey = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'
    
    // Generate signature for Wert widget
    const signedData = {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI contract address
      commodity: 'USDC',
      commodity_amount: amount,
      network: 'ethereum',
      click_id: metadata.depositId,
    }

    // Create signature string
    const signatureString = Object.keys(signedData)
      .sort()
      .map(key => `${key}=${signedData[key]}`)
      .join('&')

    console.log('Signature string:', signatureString)

    // Create HMAC signature
    const signature = createHmac('sha256', privateKey.slice(2)) // Remove 0x prefix
      .update(signatureString)
      .digest('hex')

    console.log('Generated signature:', signature)

    // Build Wert widget URL with all parameters
    const baseUrl = 'https://sandbox-widget.wert.io'
    const widgetParams = new URLSearchParams({
      partner_id: partnerId,
      click_id: metadata.depositId,
      origin: 'https://sandbox.wert.io',
      theme: 'dark',
      color_buttons: '01D4AA',
      color_secondary: '344152', 
      color_main: 'FFFFFF',
      color_icons: '01D4AA',
      commodity: 'USDC',
      commodity_amount: amount.toString(),
      network: 'ethereum',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      signature: signature,
    })

    const paymentUrl = `${baseUrl}?${widgetParams.toString()}`

    console.log('Generated payment URL:', paymentUrl)

    // Update deposit record with pending status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: 'pending',
          wert_order_id: metadata.depositId // Use deposit ID as order reference
        })
        .eq('id', metadata.depositId)

      if (updateError) {
        console.error('Error updating deposit:', updateError)
      } else {
        console.log('Deposit updated successfully')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: paymentUrl,
        orderId: metadata.depositId,
        amount: amount,
        currency: 'USD'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== Payment Function Error ===')
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