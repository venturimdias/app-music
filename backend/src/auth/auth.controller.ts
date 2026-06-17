import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RecaptchaService } from './recaptcha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

const COOKIE = 'access_token';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProd,
  maxAge: ONE_DAY_MS,
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.recaptcha.verify(dto.recaptchaToken, 'register');
    const user = await this.auth.register(dto);
    const token = this.auth.signToken(user);
    res.cookie(COOKIE, token, cookieOptions);
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfilId: user.perfilId,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.recaptcha.verify(dto.recaptchaToken, 'login');
    const user = await this.auth.validateUser(dto.email, dto.password);
    const token = this.auth.signToken(user);
    res.cookie(COOKIE, token, cookieOptions);
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfilId: user.perfilId,
    };
  }

  @Put('password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(userId, dto);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, cookieOptions);
    return { ok: true };
  }

  // Retorna o payload JWT + plano atual (lido do banco para estar sempre atualizado).
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const plan = await this.auth.getUserPlan(user.sub);
    return { ...user, plan };
  }
}
