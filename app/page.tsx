'use client';
const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

if (!clientId) {
  console.warn("PayPal Client ID is missing. Check your .env.local file.");
}
import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [checkout, setCheckout] = useState<{ amount: number; description: string } | null>(null);

const sendMessage = async () => {
  if (!input.trim()) return;
  const newMessages = [...messages, { role: 'user', content: input }];
  setMessages(newMessages);
  setInput('');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('API Error Response:', errText);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Server error. Please check backend logs.' },
      ]);
      return;
    }

    const data = await res.json();
    setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    if (data.checkoutDetails) {
      setCheckout(data.checkoutDetails);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '' }}>
      <main className="max-w-2xl mx-auto p-6 flex flex-col h-screen">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Smart AI Concierge & Invoicing</h1>
        
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-white text-gray-800 border'}`}>
              {m.content}
            </div>
          ))}

          {checkout && (
            <div className="p-4 bg-white border border-green-500 rounded-lg shadow-md my-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">PayPal Sandbox Checkout</h3>
              <p className="text-sm text-gray-600 mb-3">{checkout.description} — <strong>${checkout.amount}</strong></p>
              
              <PayPalButtons
                createOrder={async () => {
                  const res = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: checkout.amount, description: checkout.description }),
                  });
                  const order = await res.json();
                  return order.id;
                }}
                onApprove={async (data, actions) => {
                  alert(`Transaction completed by Sandbox Account! Order ID: ${data.orderID}`);
                  setCheckout(null);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            className="flex-1 border p-2 rounded-lg text-black"
            placeholder="e.g. Generate an invoice for 5 hours of consulting at $50/hr..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="bg-blue-600 text-white px-5 py-2 rounded-lg">Send</button>
        </div>
      </main>
    </PayPalScriptProvider>
  );
}