import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaidlyInvoiceRequest {
  amount: number
  currency: string
  customerEmail: string
  description: string
  metadata: {
    depositId: string
    username: string
    gameName: string
    paymentMethod: 'bitcoin' | 'lightning'
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, customerEmail, description, metadata }: PaidlyInvoiceRequest = await req.json()

    console.log('Creating Paidly invoice with data:', { amount, currency, customerEmail, description, metadata })

    // Get Paidly credentials from environment
    const paidlyApiKey = Deno.env.get('PAIDLY_API_KEY')
    const paidlyStoreId = Deno.env.get('PAIDLY_STORE_ID')

    if (!paidlyApiKey || !paidlyStoreId) {
      console.error('Missing Paidly credentials')
      return new Response(
        JSON.stringify({ success: false, error: 'Paidly credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create invoice with Paidly API
    const paidlyResponse = await fetch('https://api.paidlyinteractive.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paidlyApiKey}`,
        'Content-Type': 'application/json',
        'X-Store-ID': paidlyStoreId,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency.toUpperCase(),
        customer_email: customerEmail,
        description: description,
        payment_method: metadata.paymentMethod,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paidly-webhook`,
        metadata: {
          deposit_id: metadata.depositId,
          username: metadata.username,
          game_name: metadata.gameName,
        }
      })
    })

    const paidlyData = await paidlyResponse.text()
    console.log('Paidly API response status:', paidlyResponse.status)
    console.log('Paidly API response:', paidlyData)

    if (!paidlyResponse.ok) {
      console.error('Paidly API error:', paidlyData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create invoice: ${paidlyResponse.status} - ${paidlyData}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const invoiceData = JSON.parse(paidlyData)
    console.log('Invoice created successfully:', invoiceData)

    // Update the deposit record with the invoice ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        paidly_invoice_id: invoiceData.id,
        status: 'pending_payment' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: invoiceData,
        paymentUrl: invoiceData.payment_url || invoiceData.checkout_url
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Paidly invoice:', error)
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