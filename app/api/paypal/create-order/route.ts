import { NextResponse } from 'next/server';

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { amount, currency, description } = await req.json();
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${process.env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency || 'USD',
              value: amount.toString(),
            },
            description: description || 'AI Agent Service Fee',
          },
        ],
      }),
    });

    const order = await response.json();
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  }
}