import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Uso: @Roles('ADM') ou @Roles('ADM', 'PARTICIPANTE')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
