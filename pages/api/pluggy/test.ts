import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    const clientId = process.env.PLUG_CLIENT_ID;
    const clientSecret = process.env.PLUG_CLIENT_SECRET;
    const apiUrl = process.env.PLUG_API_URL || 'https://api.pluggy.ai';

    console.log('=== TESTE PLUGGY ===');
    console.log('Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'Não configurado');
    console.log('Client Secret:', clientSecret ? `${clientSecret.substring(0, 8)}...` : 'Não configurado');
    console.log('API URL:', apiUrl);
    console.log('User ID:', userId);

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false,
        message: 'Credenciais do Pluggy não configuradas',
        details: {
          clientId: !!clientId,
          clientSecret: !!clientSecret,
          apiUrl
        }
      });
    }

    // Teste 1: Autenticação
    console.log('Testando autenticação...');
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
    console.log('Auth Response Headers:', Object.fromEntries(authResponse.headers.entries()));

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Erro na autenticação:', errorText);
      return res.status(500).json({
        success: false,
        step: 'authentication',
        status: authResponse.status,
        error: errorText
      });
    }

    const authData = await authResponse.json();
    console.log('Auth Data:', JSON.stringify(authData, null, 2));
    
    // Pluggy returns apiKey in the response
    const accessToken = authData.apiKey || authData.accessToken || authData.access_token;

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        step: 'authentication',
        message: 'Access token não retornado',
        authData
      });
    }

    // Teste 2: Listar conectores disponíveis
    console.log('Testando listagem de conectores...');
    const connectorsResponse = await fetch(`${apiUrl}/connectors`, {
      headers: {
        'X-API-KEY': accessToken,
      },
    });

    console.log('Connectors Response Status:', connectorsResponse.status);

    let connectorsData = null;
    if (connectorsResponse.ok) {
      connectorsData = await connectorsResponse.json();
      console.log('Conectores encontrados:', connectorsData.results?.length || 0);
    } else {
      const errorText = await connectorsResponse.text();
      console.error('Erro ao listar conectores:', errorText);
    }

    // Teste 3: Criar connect token
    console.log('Testando criação de connect token...');
    const connectPayload = {
      itemId: null,
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

    console.log('Connect Token Payload:', JSON.stringify(connectPayload, null, 2));

    const connectResponse = await fetch(`${apiUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectPayload),
    });

    console.log('Connect Token Response Status:', connectResponse.status);
    console.log('Connect Token Response Headers:', Object.fromEntries(connectResponse.headers.entries()));

    let connectData = null;
    if (connectResponse.ok) {
      connectData = await connectResponse.json();
      console.log('Connect token criado com sucesso:', connectData.connectToken ? 'Token presente' : 'Token ausente');
    } else {
      const errorText = await connectResponse.text();
      console.error('Erro ao criar connect token:', errorText);
      return res.status(500).json({
        success: false,
        step: 'connect_token',
        status: connectResponse.status,
        error: errorText,
        accessToken: accessToken ? 'Presente' : 'Ausente'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Todos os testes passaram!',
      data: {
        authentication: {
          status: authResponse.status,
          tokenPresent: !!accessToken
        },
        connectors: {
          status: connectorsResponse.status,
          count: connectorsData?.results?.length || 0
        },
        connectToken: {
          status: connectResponse.status,
          tokenCreated: !!connectData?.connectToken,
          token: connectData?.connectToken ? 'Presente' : 'Ausente'
        }
      }
    });

  } catch (error) {
    console.error('Erro no teste do Pluggy:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro no teste',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}