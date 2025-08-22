# Sistema Financeiro Premium

Um sistema completo de gestão financeira pessoal com integração bancária automática via OpenFinance e cobrança via Stripe.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão completa das finanças com gráficos e métricas
- **Integração Bancária**: Sincronização automática com bancos via OpenFinance
- **Gestão de Transações**: Controle manual e automático de receitas e despesas
- **Relatórios**: Exportação em PDF com análises detalhadas
- **Assinatura Premium**: Sistema de cobrança recorrente via Stripe
- **Período de Teste**: 30 dias grátis para novos usuários

## 🛠️ Tecnologias

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: Neon Database (PostgreSQL)
- **Autenticação**: JWT + Cookies
- **Pagamentos**: Stripe
- **Integração Bancária**: Pluggy (OpenFinance)
- **Gráficos**: Recharts
- **PDF**: jsPDF

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Neon Database
- Conta no Stripe
- Conta no Pluggy (opcional, para integração bancária)

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd financial-system
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo `.env.local` e configure com suas credenciais:

```env
# Neon Database Configuration
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_random

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# OpenFinance/Plug Configuration (opcional)
PLUG_API_URL=https://api.pluggy.ai
PLUG_CLIENT_ID=your_plug_client_id
PLUG_CLIENT_SECRET=your_plug_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configure o Neon Database

1. Crie um novo projeto no [Neon](https://neon.tech)
2. Execute o schema SQL que está em `neon/schema.sql`
3. Obtenha a connection string no painel do Neon
4. Configure a variável `DATABASE_URL` no arquivo `.env.local`

### 4. Configure o Stripe

1. Crie uma conta no [Stripe](https://stripe.com)
2. Configure um produto e preço recorrente
3. Configure o webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Eventos do webhook necessários:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

### 5. Configure o Pluggy (Opcional)

1. Crie uma conta no [Pluggy](https://pluggy.ai)
2. Obtenha suas credenciais de API
3. Configure os webhooks se necessário

### Configuração do Pluggy (OpenFinance)

Para usar a integração com bancos via OpenFinance, você precisa:

1. **Criar conta no Pluggy**:
   - Acesse [https://pluggy.ai](https://pluggy.ai)
   - Crie uma conta de desenvolvedor
   - Acesse o dashboard

2. **Obter credenciais**:
   - No dashboard do Pluggy, vá em "API Keys"
   - Copie o `Client ID` e `Client Secret`
   - Configure no arquivo `.env.local`:
     ```env
     PLUG_CLIENT_ID=seu_client_id_aqui
     PLUG_CLIENT_SECRET=seu_client_secret_aqui
     ```

3. **Configurar Webhook (opcional)**:
   - URL do webhook: `https://seu-dominio.com/api/pluggy/webhook`
   - Eventos: `item/updated`, `item/error`

**Nota**: O Pluggy oferece um ambiente de sandbox para testes. As credenciais de sandbox são diferentes das de produção.
## 🚀 Executando o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
├── app/                    # App Router (Next.js 13+)
├── pages/                  # Pages Router (API routes e páginas)
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── webhooks/      # Webhooks do Stripe
│   │   └── ...
│   ├── dashboard.tsx      # Dashboard principal
│   ├── login.tsx          # Página de login
│   └── register.tsx       # Página de registro
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI
│   └── Layout.tsx        # Layout principal
├── lib/                  # Utilitários e configurações
│   ├── auth.ts           # Autenticação JWT
│   ├── database.ts       # Operações do banco
│   ├── stripe.ts         # Integração Stripe
│   └── openfinance.ts    # Integração OpenFinance
└── neon/
    └── schema.sql        # Schema do banco
```

## 🔐 Segurança

- Autenticação via JWT com cookies httpOnly
- Conexão SSL obrigatória com Neon
- Validação de dados com Zod
- Middleware de autenticação
- Sanitização de inputs

## 📊 Funcionalidades Principais

### Dashboard
- Resumo financeiro com cards de métricas
- Gráficos de evolução temporal
- Gráfico de gastos por categoria
- Lista de transações recentes

### Gestão de Contas
- Conexão com bancos via OpenFinance
- Adição manual de contas
- Sincronização automática de saldos

### Transações
- Importação automática via OpenFinance
- Adição manual de transações
- Categorização automática e manual
- Filtros e busca avançada

### Relatórios
- Exportação em PDF
- Análises por período
- Comparativos mensais
- Relatórios por categoria

### Sistema de Assinatura
- Período de teste de 30 dias
- Cobrança recorrente via Stripe
- Gestão de status da assinatura
- Webhooks para atualizações automáticas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para support@yourapp.com ou abra uma issue no GitHub.