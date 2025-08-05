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
    const apiKey = '776572742d6465762d63386637633633352d316333662d343034392d383732622d376637313837643332306134'
    
    // Create Wert order using their API
    const orderData = {
      partner_id: partnerId,
      click_id: metadata.depositId,
      origin: 'https://shawn-sweepstakes.com',
      commodity: 'USDC',
      commodity_amount: amount,
      network: 'ethereum',
      address: '0xA0b86a33E6441e6e80A7181a02F6109c4E8c1b8E', // USDC contract address
      redirect_url: 'https://shawn-sweepstakes.com',
      extra: {
        item_info: {
          author: 'Shawn Sweepstakes',
          name: `${metadata.gameName} Deposit`,
          category: 'Gaming',
          seller: 'Shawn Sweepstakes',
          seller_id: 'shawn-sweepstakes'
        }
      }
    }
    
    // Wert widget configuration
    const widgetData = {
      partner_id: partnerId,
      click_id: metadata.depositId,
      origin: 'https://shawn-sweepstakes.com',
      commodity: 'USDC',
      commodity_amount: amount,
      network: 'ethereum',
      address: '0xA0b86a33E6441e6e80A7181a02F6109c4E8c1b8E', // USDC contract address
      redirect_url: 'https://shawn-sweepstakes.com',
      extra: {
        item_info: {
          author: 'Shawn Sweepstakes',
          name: `${metadata.gameName} Deposit`,
          category: 'Gaming',
          seller: 'Shawn Sweepstakes',
          seller_id: 'shawn-sweepstakes'
        }
      }
    }

    // Create signature for the order
    const signatureData = {
      address: orderData.address,
      commodity: orderData.commodity,
      commodity_amount: orderData.commodity_amount,
      network: orderData.network,
      click_id: orderData.click_id
    }

    // Create signature string (alphabetically sorted)
    const signatureString = Object.keys(signatureData)
      .sort()
      .map(key => `${key}=${signatureData[key]}`)
      .join('&')

    console.log('Signature string:', signatureString)

    // Create HMAC signature
    const signature = createHmac('sha256', privateKey.slice(2)) // Remove 0x prefix
      .update(signatureString)
      .digest('hex')

    console.log('Generated signature:', signature)

    // Create Wert widget URL
    const baseUrl = 'https://sandbox-widget.wert.io'
    const widgetParams = new URLSearchParams({
      partner_id: partnerId,
      ...widgetData,
      commodity_amount: amount.toString(),
      signature: signature,
      theme: 'dark',
      color_buttons: '3B82F6',
      color_secondary: '1E293B',
      color_main: 'FFFFFF',
      color_icons: '3B82F6'
    })

    const paymentUrl = `${baseUrl}?${widgetParams.toString()}`

    console.log('Generated payment URL:', paymentUrl)

    // Update deposit record with Wert order ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: 'pending',
          wert_order_id: metadata.depositId,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.depositId)

      if (updateError) {
        console.error('Error updating deposit:', updateError)
      } else {
        console.log('Deposit updated successfully')
      }
    }

    // Create signature string (only for required fields)
    const signatureFields = {
      address: widgetData.address,
      commodity: widgetData.commodity,
      commodity_amount: widgetData.commodity_amount,
      network: widgetData.network,
      click_id: widgetData.click_id
    }
    
    const signatureString2 = Object.keys(signatureFields)
      .sort()
      .map(key => `${key}=${signatureFields[key]}`)
      .join('&')

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