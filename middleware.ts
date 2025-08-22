import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/login', 
    '/register', 
    '/api/auth/login', 
    '/api/auth/register', 
    '/api/webhooks/stripe', 
    '/api/test-db', 
    '/api/user/status',
    '/.well-known'
  ];
  
  if (publicPaths.some(path => pathname.startsWith(path)) || pathname.includes('.well-known')) {
    return NextResponse.next();
  }

  // Verificar token para rotas protegidas
  const token = request.cookies.get('auth-token')?.value;

  console.log('Middleware - Pathname:', pathname);
  console.log('Middleware - Token exists:', !!token);
  if (!token) {
    console.log('Middleware - No token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyTokenEdge(token);
    console.log('Middleware - Token valid for user:', payload.email);
    
    // Adicionar informações do usuário ao header para as páginas
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-status', payload.status);
    
    // Verificar se o usuário tem acesso (não suspenso/cancelado)
    if (payload.status === 'suspended' || payload.status === 'cancelled') {
      console.log('Middleware - User suspended/cancelled, redirecting to subscription');
      return NextResponse.redirect(new URL('/subscription', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};