import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.cookies['auth-token']
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' })
    }

    const payload = verifyToken(token)
    const userId = payload.userId

    // Configurações Pluggy
    const clientId = process.env.PLUG_CLIENT_ID
    const clientSecret = process.env.PLUG_CLIENT_SECRET
    const apiUrl = process.env.PLUG_API_URL || 'https://api.pluggy.ai'

    console.log('Pluggy Config:', {
      clientId: clientId ? 'Configurado' : 'Não configurado',
      clientSecret: clientSecret ? 'Configurado' : 'Não configurado',
      apiUrl
    })

    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: 'Credenciais Pluggy não configuradas' })
    }

    // Autenticar com a Pluggy API
    const authRes = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    })

    const authData = await authRes.json()
    if (!authRes.ok) {
      return res.status(500).json({ message: 'Falha na autenticação com Pluggy', error: authData })
    }

    const apiKey = authData.apiKey
    console.log('Autenticação bem-sucedida, criando connect token...')

    // Criar connect token
    const connectRes = await fetch(`${apiUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: null,
        clientUserId: userId,
        options: {
          language: 'pt',
          products: ['accounts', 'transactions']
        }
      })
    })

    const connectData = await connectRes.json()
    if (!connectRes.ok) {
      return res.status(500).json({ message: 'Erro ao criar connect token', error: connectData })
    }

    // 🔑 Aqui o campo correto é accessToken
    const connectToken = connectData.accessToken
    if (!connectToken) {
      console.error('Connect token ausente na resposta:', connectData)
      return res.status(500).json({ message: 'Connect token ausente na resposta da API' })
    }

    console.log('Connect token extraído com sucesso!')
    return res.status(200).json({ connectToken })
  } catch (error: any) {
    console.error('Erro no endpoint /api/pluggy/connect:', error)
    return res.status(500).json({ message: 'Erro interno', error: error.message })
  }
}
