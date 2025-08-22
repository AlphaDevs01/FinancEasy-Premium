import { NextApiRequest, NextApiResponse } from 'next';
import { createUser, getUserByEmail } from '../../../lib/database';
import { hashPassword, generateToken } from '../../../lib/auth';
import { createCustomer } from '../../../lib/stripe';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-neon-endpoint')) {
      return res.status(500).json({ 
        message: 'Banco de dados não configurado. Configure a DATABASE_URL no arquivo .env.local' 
      });
    }

    // Verificar se o usuário já existe
    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
    } catch (dbError) {
      console.error('Erro de conexão com banco:', dbError);
      return res.status(500).json({ 
        message: 'Erro de conexão com banco de dados. Verifique se a DATABASE_URL está correta.' 
      });
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar customer no Stripe (opcional, pode ser feito depois)
    let stripeCustomerId = null;
    try {
      const stripeCustomer = await createCustomer(email, name);
      stripeCustomerId = stripeCustomer.id;
    } catch (error) {
      console.warn('Erro ao criar customer no Stripe:', error);
    }

    // Criar usuário no banco
    const user = await createUser({
      name,
      email,
      password_hash: passwordHash,
      stripe_customer_id: stripeCustomerId,
      status: 'trial',
      trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
    });

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      status: user.status,
    });

    // Configurar cookie com opções seguras
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}