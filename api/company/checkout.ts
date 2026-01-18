import Stripe from 'stripe';

export const config = {
  runtime: 'edge',
};

type BundleId = 'basic' | 'popular' | 'pro';

interface Bundle {
  id: BundleId;
  name: string;
  credits: number;
  priceCents: number;
}

const BUNDLES: Record<BundleId, Bundle> = {
  basic: {
    id: 'basic',
    name: 'Starter Pack',
    credits: 10,
    priceCents: 2900,
  },
  popular: {
    id: 'popular',
    name: 'Growth Pack',
    credits: 25,
    priceCents: 5900,
  },
  pro: {
    id: 'pro',
    name: 'Scale Pack',
    credits: 50,
    priceCents: 9900,
  },
};

interface CheckoutRequest {
  bundle_id: BundleId;
  company_id: string;
}

interface CheckoutResponse {
  url: string;
}

interface ErrorResponse {
  error: string;
}

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
  if (!stripeSecretKey) {
    console.error('[CHECKOUT] STRIPE_SECRET_KEY not configured');
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { bundle_id, company_id } = body;

  // Validate bundle_id
  if (!bundle_id || !BUNDLES[bundle_id]) {
    return new Response(
      JSON.stringify({ error: 'Invalid bundle_id. Must be one of: basic, popular, pro' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate company_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!company_id || !uuidRegex.test(company_id)) {
    return new Response(JSON.stringify({ error: 'Invalid company_id format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bundle = BUNDLES[bundle_id];

  try {
    const stripe = new Stripe(stripeSecretKey);

    // Get the origin from the request for success/cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bundle.name,
              description: `${bundle.credits} AI Job Analysis Credits`,
            },
            unit_amount: bundle.priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        company_id,
        bundle_id,
        credits_amount: bundle.credits.toString(),
      },
      success_url: `${origin}/company/purchase-credits?success=true`,
      cancel_url: `${origin}/company/purchase-credits?canceled=true`,
    });

    if (!session.url) {
      throw new Error('Stripe session URL not returned');
    }

    console.log(`[CHECKOUT] Created session for company ${company_id}, bundle ${bundle_id}`);

    const response: CheckoutResponse = { url: session.url };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[CHECKOUT] Error creating Stripe session:', err);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create checkout session',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
