import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getUserById, updateUser } from '../../../lib/database';
import { createSubscription } from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);

    if (!user.stripe_customer_id) {
      return res.status(400).json({ message: 'Customer Stripe não encontrado' });
    }

    // Criar assinatura com período de teste
    const subscription = await createSubscription(user.stripe_customer_id);

    // Atualizar usuário no banco
    await updateUser(user.id, {
      status: 'trial',
      trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice;
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent;
        
        res.status(200).json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        });
      }
    } else {
      res.status(200).json({
        subscriptionId: subscription.id,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
    }
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}