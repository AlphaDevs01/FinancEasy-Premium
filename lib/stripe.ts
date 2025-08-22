import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable. Please check your .env.local file.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1234567890'; // Substitua pelo ID real do preço no Stripe

export const createCustomer = async (email: string, name: string) => {
  return await stripe.customers.create({
    email,
    name,
  });
};

export const createSubscription = async (customerId: string) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: PRICE_ID }],
    trial_period_days: 30,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
};