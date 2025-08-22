import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';

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
    const userId = payload.userId;

    // Verificar se as credenciais do Pluggy estão configuradas
    const clientId = process.env.PLUG_CLIENT_ID;
    const clientSecret = process.env.PLUG_CLIENT_SECRET;
    const apiUrl = process.env.PLUG_API_URL || 'https://api.pluggy.ai';

    console.log('Pluggy Config:', {
      clientId: clientId ? 'Configurado' : 'Não configurado',
      clientSecret: clientSecret ? 'Configurado' : 'Não configurado',
      apiUrl
    });
    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        message: 'Credenciais do Pluggy não configuradas. Configure PLUG_CLIENT_ID e PLUG_CLIENT_SECRET no .env.local' 
      });
    }

    // Obter token de acesso do Pluggy
    console.log('Tentando autenticar com Pluggy...');
    const authResponse = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
    });

    console.log('Auth Response Status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Erro na autenticação Pluggy:', errorText);
      throw new Error(`Erro ao autenticar com Pluggy: ${authResponse.status} - ${errorText}`);
    }

    const authData = await authResponse.json();
    console.log('Autenticação bem-sucedida, criando connect token...');
    
    // Pluggy returns apiKey in the response
    const accessToken = authData.apiKey || authData.accessToken || authData.access_token;
    
    console.log('Access token obtido:', accessToken ? 'Token presente' : 'Token ausente');
    
    if (!accessToken) {
      console.error('Access token não encontrado na resposta:', authData);
      throw new Error('Access token não retornado pela API do Pluggy');
    }

    // Criar Connect Token para o usuário
    const connectPayload = {
      itemId: null, // Para nova conexão
      clientUserId: userId,
      options: {
        language: 'pt',
        products: ['accounts', 'transactions'],
      },
    };
    
    // Só adicionar webhook URL se estivermos em produção (HTTPS)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (appUrl.startsWith('https://')) {
      connectPayload.options.webhookUrl = `${appUrl}/api/pluggy/webhook`;
    }
    
    console.log('Payload do connect token:', JSON.stringify(connectPayload, null, 2));
    
    // Pluggy uses X-API-KEY header instead of Bearer token
    const headers = {
      'X-API-KEY': accessToken,
      'Content-Type': 'application/json',
    };
    
    console.log('Headers da requisição:', headers);
    
    const connectResponse = await fetch(`${apiUrl}/connect_token`, {
      method: 'POST',
      headers,
      body: JSON.stringify(connectPayload),
    });

    console.log('Connect Token Response Status:', connectResponse.status);
    if (!connectResponse.ok) {
      const errorText = await connectResponse.text();
      console.error('Erro ao criar connect token:', errorText);
      throw new Error(`Erro ao criar connect token: ${connectResponse.status} - ${errorText}`);
    }

    const connectData = await connectResponse.json();
    console.log('Resposta completa do connect token:', JSON.stringify(connectData, null, 2));
    
    // O Pluggy pode retornar o token em diferentes campos
    const connectToken = connectData.connectToken || connectData.connect_token || connectData.token;
    
    console.log('Connect token extraído:', {
      tokenPresent: !!connectToken,
      tokenLength: connectToken?.length || 0,
      availableFields: Object.keys(connectData)
    });
    
    if (!connectToken) {
      console.error('Connect token não encontrado na resposta:', connectData);
      throw new Error('Connect token não retornado pela API do Pluggy');
    }
    
    // URL do Pluggy Connect
    const connectUrl = `https://connect.pluggy.ai/?connectToken=${connectToken}`;

    console.log('URL final do Pluggy Connect:', connectUrl);

    res.status(200).json({
      connectUrl,
      connectToken: connectToken,
    });
  } catch (error) {
    console.error('Erro ao conectar com Pluggy:', error);
    res.status(500).json({ 
      message: 'Erro ao conectar com banco',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}