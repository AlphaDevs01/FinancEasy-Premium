import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Crown } from 'lucide-react';

export default function Subscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('');

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/user/status');
      const data = await response.json();
      setUserStatus(data.status);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        // Redirecionar para o Stripe Checkout
        window.location.href = data.url;
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Dashboard financeiro completo',
    'Integração automática com bancos',
    'Controle de receitas e despesas',
    'Relatórios detalhados',
    'Exportação em PDF e CSV',
    'Sincronização em tempo real',
    'Suporte prioritário',
    'Backup automático dos dados',
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Plano Premium
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tenha controle total das suas finanças
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">R$ 14,99</div>
            <div className="text-sm text-gray-500">por mês</div>
            <div className="mt-2 text-sm text-green-600 font-medium">
              30 dias grátis para testar
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recursos inclusos:
            </h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            {userStatus === 'trial' ? (
              <div className="text-center">
                <p className="text-sm text-green-600 mb-4">
                  Seu período de teste está ativo!
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Ir para o Dashboard
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartTrial}
                loading={loading}
                className="w-full"
              >
                Começar Teste Grátis
              </Button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Cancele a qualquer momento. Sem compromisso.
              <br />
              Após o período de teste, será cobrado R$ 14,99/mês.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}