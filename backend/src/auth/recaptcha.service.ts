import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

const MIN_SCORE = 0.5;

@Injectable()
export class RecaptchaService {
  constructor(private readonly config: ConfigService) {}

  // Em dev, sem RECAPTCHA_SECRET_KEY configurado, a verificação é pulada.
  async verify(token: string, expectedAction: string): Promise<void> {
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) return;

    if (!token) {
      throw new BadRequestException('Verificação reCAPTCHA ausente');
    }

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data: SiteVerifyResponse = await res.json();

    if (!data.success || data.action !== expectedAction || (data.score ?? 0) < MIN_SCORE) {
      throw new BadRequestException('Verificação reCAPTCHA falhou');
    }
  }
}
