'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar autenticação via API
    const checkAuth = async () => {
      try {
        console.log('Verificando autenticação...');
        const response = await fetch('/api/user/status');
        console.log('Status da resposta:', response.status);
        
        if (response.ok) {
          console.log('Usuário autenticado, redirecionando para dashboard');
          window.location.href = '/dashboard';
        } else {
          console.log('Usuário não autenticado, redirecionando para login');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/login';
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isChecking ? 'Verificando autenticação...' : 'Redirecionando...'}
        </p>
      </div>
    </main>
  );
}
