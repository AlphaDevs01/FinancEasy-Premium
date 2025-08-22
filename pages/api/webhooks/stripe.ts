import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { updateUser } from '../../../lib/database';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    const body = JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'invoice.paid':
        const paidInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(paidInvoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler error' });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  try {
    // Find user by stripe customer ID and update status
    const pool = require('pg').Pool;
    const dbPool = new pool({ connectionString: process.env.DATABASE_URL });
    const client = await dbPool.connect();
    
    try {
      const userResult = await client.query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
      if (userResult.rows.length > 0) {
        await updateUser(userResult.rows[0].id, { status: 'active' });
      }
    } finally {
      client.release();
      await dbPool.end();
    }
  } catch (error) {
    console.error('Error updating user status to active:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  try {
    const pool = require('pg').Pool;
    const dbPool = new pool({ connectionString: process.env.DATABASE_URL });
    const client = await dbPool.connect();
    
    try {
      const userResult = await client.query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
      if (userResult.rows.length > 0) {
        await updateUser(userResult.rows[0].id, { status: 'suspended' });
      }
    } finally {
      client.release();
      await dbPool.end();
    }
  } catch (error) {
    console.error('Error updating user status to suspended:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  try {
    const pool = require('pg').Pool;
    const dbPool = new pool({ connectionString: process.env.DATABASE_URL });
    const client = await dbPool.connect();
    
    try {
      const userResult = await client.query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
      if (userResult.rows.length > 0) {
        await updateUser(userResult.rows[0].id, { status: 'cancelled' });
      }
    } finally {
      client.release();
      await dbPool.end();
    }
  } catch (error) {
    console.error('Error updating user status to cancelled:', error);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};