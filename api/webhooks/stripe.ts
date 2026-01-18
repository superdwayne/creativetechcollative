import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Bundle price mapping for validation
const BUNDLE_PRICES: Record<string, { credits: number; priceCents: number }> = {
  basic: { credits: 10, priceCents: 2900 },
  popular: { credits: 25, priceCents: 5900 },
  pro: { credits: 50, priceCents: 9900 },
};

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    console.error('[STRIPE-WEBHOOK] STRIPE_SECRET_KEY not configured');
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!stripeWebhookSecret) {
    console.error('[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[STRIPE-WEBHOOK] Supabase credentials not configured');
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get the raw body and signature header
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('[STRIPE-WEBHOOK] Missing stripe-signature header');
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let event: Stripe.Event;
  let rawBody: string;

  try {
    // Get raw body for signature verification
    rawBody = await req.text();

    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[STRIPE-WEBHOOK] Signature verification failed:', errorMessage);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[STRIPE-WEBHOOK] Received event: ${event.type}, id: ${event.id}`);

  // Handle specific event types
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata
    const companyId = session.metadata?.company_id;
    const bundleId = session.metadata?.bundle_id;
    const creditsAmountStr = session.metadata?.credits_amount;

    if (!companyId || !creditsAmountStr) {
      console.error('[STRIPE-WEBHOOK] Missing required metadata in session:', {
        companyId,
        bundleId,
        creditsAmountStr,
      });
      // Still return 200 to acknowledge receipt (don't retry on bad metadata)
      return new Response(JSON.stringify({ received: true, error: 'Missing metadata' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const creditsAmount = parseInt(creditsAmountStr, 10);
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      console.error('[STRIPE-WEBHOOK] Invalid credits_amount:', creditsAmountStr);
      return new Response(JSON.stringify({ received: true, error: 'Invalid credits amount' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get price in cents from bundle or session
    const priceCents = session.amount_total || BUNDLE_PRICES[bundleId || '']?.priceCents || 0;
    const stripePaymentId = session.payment_intent as string || session.id;

    console.log(`[STRIPE-WEBHOOK] Processing payment for company ${companyId}:`, {
      bundleId,
      creditsAmount,
      priceCents,
      stripePaymentId,
    });

    try {
      // Check if this payment has already been processed (idempotency check)
      const { data: existingPurchase, error: checkError } = await supabase
        .from('credit_purchases')
        .select('id')
        .eq('stripe_payment_id', stripePaymentId)
        .maybeSingle();

      if (checkError) {
        console.error('[STRIPE-WEBHOOK] Error checking for existing purchase:', checkError);
        // Continue anyway - let the insert handle duplicates
      }

      if (existingPurchase) {
        console.log(`[STRIPE-WEBHOOK] Payment ${stripePaymentId} already processed, skipping`);
        return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // First, get the current purchased_credits value
      const { data: currentCredits, error: fetchError } = await supabase
        .from('company_analysis_credits')
        .select('purchased_credits')
        .eq('company_id', companyId)
        .single();

      if (fetchError) {
        // If no record exists, we need to create one
        if (fetchError.code === 'PGRST116') {
          console.log(`[STRIPE-WEBHOOK] No credits record for company ${companyId}, creating one`);
          const { error: insertError } = await supabase
            .from('company_analysis_credits')
            .insert({
              company_id: companyId,
              free_analyses_remaining: 5,
              purchased_credits: creditsAmount,
            });

          if (insertError) {
            console.error('[STRIPE-WEBHOOK] Error creating credits record:', insertError);
            throw insertError;
          }
        } else {
          console.error('[STRIPE-WEBHOOK] Error fetching current credits:', fetchError);
          throw fetchError;
        }
      } else {
        // Update existing record - add credits
        const newPurchasedCredits = (currentCredits?.purchased_credits || 0) + creditsAmount;

        const { error: updateError } = await supabase
          .from('company_analysis_credits')
          .update({
            purchased_credits: newPurchasedCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId);

        if (updateError) {
          console.error('[STRIPE-WEBHOOK] Error updating credits:', updateError);
          throw updateError;
        }

        console.log(`[STRIPE-WEBHOOK] Updated credits for company ${companyId}: ${currentCredits?.purchased_credits || 0} -> ${newPurchasedCredits}`);
      }

      // Record the purchase in credit_purchases table
      const { error: purchaseError } = await supabase
        .from('credit_purchases')
        .insert({
          company_id: companyId,
          credits_amount: creditsAmount,
          price_cents: priceCents,
          stripe_payment_id: stripePaymentId,
        });

      if (purchaseError) {
        console.error('[STRIPE-WEBHOOK] Error recording purchase:', purchaseError);
        // Don't throw here - credits were already added, logging is secondary
      }

      console.log(`[STRIPE-WEBHOOK] Successfully processed payment for company ${companyId}: +${creditsAmount} credits`);

      return new Response(JSON.stringify({ received: true, success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[STRIPE-WEBHOOK] Error processing payment:', errorMessage);
      // Return 500 to signal Stripe to retry
      return new Response(JSON.stringify({ error: 'Processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // For other event types, just acknowledge receipt
  console.log(`[STRIPE-WEBHOOK] Unhandled event type: ${event.type}`);
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
