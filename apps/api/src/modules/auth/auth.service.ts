import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as QRCode from 'qrcode';
import Redis from 'ioredis';

interface OtpData {
  code: string;
  expiresAt: number;
  fullName?: string;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  // Fallback in-memory store if Redis unavailable
  private memoryStore = new Map<string, string>();
  private useRedis = false;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
        await this.redis.connect();
        this.useRedis = true;
        console.log('[Auth] OTP store: Redis connected');
      } catch (err) {
        console.warn('[Auth] Redis unavailable, using in-memory OTP store');
        this.redis = null;
        this.useRedis = false;
      }
    } else {
      console.log('[Auth] No REDIS_URL configured, using in-memory OTP store');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async setOtp(key: string, data: OtpData, ttlSeconds = 300) {
    const json = JSON.stringify(data);
    if (this.useRedis && this.redis) {
      await this.redis.setex(`otp:${key}`, ttlSeconds, json);
    } else {
      this.memoryStore.set(key, json);
      setTimeout(() => this.memoryStore.delete(key), ttlSeconds * 1000);
    }
  }

  private async getOtp(key: string): Promise<OtpData | null> {
    let json: string | null = null;
    if (this.useRedis && this.redis) {
      json = await this.redis.get(`otp:${key}`);
    } else {
      json = this.memoryStore.get(key) || null;
    }
    if (!json) return null;
    return JSON.parse(json);
  }

  private async deleteOtp(key: string) {
    if (this.useRedis && this.redis) {
      await this.redis.del(`otp:${key}`);
    } else {
      this.memoryStore.delete(key);
    }
  }

  // ─── Auth Methods ──────────────────────────────────────────────────────

  async register(phone: string, fullName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('Пользователь с таким номером уже существует');
    }

    const code = this.generateOtp();
    await this.setOtp(`reg:${phone}`, { code, expiresAt: Date.now() + 5 * 60 * 1000, fullName });

    // TODO: integrate real SMS provider (Tajikistan-compatible)
    if (this.config.get('NODE_ENV') !== 'production') {
      console.log(`[OTP] Registration code for ${phone}: ${code}`);
    }

    return { message: 'OTP отправлен', phone };
  }

  async verifyOtp(phone: string, code: string) {
    const regKey = `reg:${phone}`;
    const loginKey = `login:${phone}`;

    let stored = await this.getOtp(regKey);
    let isRegistration = true;

    if (!stored) {
      stored = await this.getOtp(loginKey);
      isRegistration = false;
    }

    if (!stored) {
      throw new BadRequestException('OTP не найден. Запросите новый код');
    }

    if (Date.now() > stored.expiresAt) {
      await this.deleteOtp(regKey);
      await this.deleteOtp(loginKey);
      throw new BadRequestException('OTP истёк. Запросите новый код');
    }

    // In dev mode accept "0000" as universal OTP
    const isDev = this.config.get('NODE_ENV') !== 'production';
    if (stored.code !== code && !(isDev && code === '0000')) {
      throw new UnauthorizedException('Неверный OTP код');
    }

    const savedFullName = stored.fullName;
    await this.deleteOtp(regKey);
    await this.deleteOtp(loginKey);

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user && isRegistration) {
      const clientCode = await this.generateClientCode();
      const qrDataUrl = await QRCode.toDataURL(clientCode, { width: 300 });

      user = await this.prisma.user.create({
        data: {
          phone,
          fullName: savedFullName || null,
          clientCode,
          qrCodeUrl: qrDataUrl,
          role: UserRole.CUSTOMER,
        },
      });
    }

    if (!user) {
      throw new BadRequestException('Пользователь не найден. Сначала зарегистрируйтесь');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        clientCode: user.clientCode,
      },
    };
  }

  async login(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    const code = this.generateOtp();
    await this.setOtp(`login:${phone}`, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // TODO: integrate real SMS provider
    if (this.config.get('NODE_ENV') !== 'production') {
      console.log(`[OTP] Login code for ${phone}: ${code}`);
    }

    return { message: 'OTP отправлен', phone };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Невалидный refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Пользователь не найден или заблокирован');
      }

      return this.generateTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }
  }

  async telegramLink(userId: string, telegramChatId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramChatId },
    });
    return { message: 'Telegram привязан' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async generateClientCode(): Promise<string> {
    const lastUser = await this.prisma.user.findFirst({
      where: { clientCode: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { clientCode: true },
    });

    let nextNum = 1;
    if (lastUser?.clientCode) {
      const match = lastUser.clientCode.match(/CD-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `CD-${nextNum.toString().padStart(4, '0')}`;
  }

  private async generateTokens(userId: string, role: UserRole) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, role, type: 'access' },
        { expiresIn: '1d' },
      ),
      this.jwt.signAsync(
        { sub: userId, role, type: 'refresh' },
        { expiresIn: '30d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
