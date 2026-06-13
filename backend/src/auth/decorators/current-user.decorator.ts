import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: number; // id do usuário
  email: string;
  perfilId: number;
  perfil: string; // 'ADM' | 'PARTICIPANTE'
}

// Uso: metodo(@CurrentUser() user: AuthUser) ou @CurrentUser('sub') userId: number
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
  },
);
