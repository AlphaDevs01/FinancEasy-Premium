import { NextApiRequest, NextApiResponse } from 'next';
import { pluggyService } from '../../../lib/openfinance';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verificar se o webhook vem do Pluggy (opcional: verificar assinatura)
    const webhookData = req.body;
    
    console.log('Webhook recebido do Pluggy:', webhookData);

    // Processar webhook
    await pluggyService.handleWebhook(webhookData);

    res.status(200).json({ message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ message: 'Erro ao processar webhook' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};