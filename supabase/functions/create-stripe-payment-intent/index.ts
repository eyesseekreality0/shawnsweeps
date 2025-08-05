import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StripePaymentRequest {
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
    const { amount, currency, customerEmail, description, metadata }: StripePaymentRequest = await req.json()

    console.log('Creating Stripe payment intent with data:', { amount, currency, customerEmail, description, metadata })

    // Stripe API credentials - these should be set in your Supabase environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY environment variable not set')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe configuration missing. Please contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Stripe payment intent
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: currency.toLowerCase(),
        description: description,
        receipt_email: customerEmail,
        'metadata[deposit_id]': metadata.depositId,
        'metadata[username]': metadata.username,
        'metadata[game_name]': metadata.gameName,
        automatic_payment_methods: 'true',
      })
    })

    const stripeData = await stripeResponse.text()
    console.log('Stripe API response status:', stripeResponse.status)
    console.log('Stripe API response body:', stripeData)

    if (!stripeResponse.ok) {
      console.error('Stripe API error details:')
      console.error('Status:', stripeResponse.status)
      console.error('StatusText:', stripeResponse.statusText)
      console.error('Response:', stripeData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Stripe API error: ${stripeResponse.status} - ${stripeData}`,
          details: {
            status: stripeResponse.status,
            statusText: stripeResponse.statusText,
            body: stripeData
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentIntent = JSON.parse(stripeData)
    console.log('Stripe payment intent created successfully:', paymentIntent)

    // Update the deposit record with the payment intent ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending_payment' 
      })
      .eq('id', metadata.depositId)

    if (updateError) {
      console.error('Error updating deposit:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating Stripe payment intent:', error)
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