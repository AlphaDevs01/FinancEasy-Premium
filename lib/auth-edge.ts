// Edge-compatible JWT functions for middleware
export interface JWTPayload {
  userId: string;
  email: string;
  status: string;
  iat?: number;
  exp?: number;
}

// Base64 URL decode function
function base64UrlDecode(str: string): string {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

// Simple JWT verification for edge runtime
export const verifyTokenEdge = (token: string): JWTPayload => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload as JWTPayload;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    throw new Error('Token inválido');
  }
};