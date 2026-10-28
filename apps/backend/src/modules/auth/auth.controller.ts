import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthenticatedUser } from './types/token-payload';
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
} from './auth.constants';
import {
  AuthUser,
  LoginResponseData,
  SessionsResponseData,
} from '@tampilkit-ac/api-contract';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  private readonly isProduction: boolean;
  private readonly sameSite: 'lax' | 'strict' | 'none';

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.isProduction =
      this.config.get<string>('nodeEnv') === 'production' ||
      process.env.AUTH_COOKIE_SECURE === 'true';
    this.sameSite =
      this.config.get<'lax' | 'strict' | 'none'>('auth.cookieSameSite') ||
      'lax';
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Masuk dengan email dan password' })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil, token dikirimkan melalui HttpOnly cookie.',
  })
  @ApiResponse({ status: 401, description: 'Email atau password tidak sesuai.' })
  @ApiResponse({ status: 429, description: 'Batas percobaan terlampaui.' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<LoginResponseData> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(dto, ip, userAgent);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Penyegaran token akses menggunakan HttpOnly refresh cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Rotasi token berhasil, cookies diperbarui.',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token tidak valid, telah dipakai, atau kedaluwarsa.',
  })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<LoginResponseData> {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken) {
      throw new UnauthorizedException(
        'Refresh token tidak ditemukan di dalam cookie.',
      );
    }

    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refresh(
      rawRefreshToken,
      ip,
      userAgent,
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Keluar dari perangkat / sesi saat ini' })
  @ApiResponse({ status: 200, description: 'Logout berhasil, sesi dicabut.' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ message: string }> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    await this.authService.logout(user.sessionId, user.id, ip);
    this.clearAuthCookies(res);

    return {
      message: 'Berhasil keluar dari sesi saat ini.',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Keluar dari semua perangkat dan sesi aktif' })
  @ApiResponse({
    status: 200,
    description: 'Semua sesi dicabut dan token versi dinaikkan.',
  })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ message: string }> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    await this.authService.logoutAll(userId, ip);
    this.clearAuthCookies(res);

    return {
      message: 'Berhasil keluar dari seluruh perangkat.',
    };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mendapatkan profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Data profil pengguna terautentikasi.' })
  async getMe(@CurrentUser('id') userId: string): Promise<AuthUser> {
    return this.authService.getMe(userId);
  }

  @Get('sessions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Daftar sesi aktif untuk pengguna saat ini' })
  @ApiResponse({ status: 200, description: 'Daftar sesi terkelola.' })
  async getSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionsResponseData> {
    const sessions = await this.authService.getSessions(
      user.id,
      user.sessionId,
    );
    return { sessions };
  }

  @Delete('sessions/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cabut sesi tertentu milik pengguna' })
  @ApiResponse({ status: 200, description: 'Sesi berhasil dicabut.' })
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
    @Req() req: FastifyRequest,
  ): Promise<{ message: string }> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    await this.authService.revokeSession(sessionId, userId, ip);
    return {
      message: 'Sesi berhasil dicabut.',
    };
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Perbarui nama tampilan profil' })
  @ApiResponse({ status: 200, description: 'Profil berhasil diperbarui.' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ganti password akun' })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil diganti, sesi lama dicabut.',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ message: string }> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    await this.authService.changePassword(userId, dto, ip, userAgent);

    // After password change, clear current cookies requiring re-authentication
    this.clearAuthCookies(res);

    return {
      message:
        'Password berhasil diperbarui. Seluruh sesi sebelumnya telah dicabut demi keamanan. Silakan login kembali.',
    };
  }

  private setAuthCookies(
    res: FastifyReply,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.setCookie(ACCESS_COOKIE_NAME, accessToken, {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.sameSite,
      maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
    });

    res.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.sameSite,
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
    });
  }

  private clearAuthCookies(res: FastifyReply): void {
    res.clearCookie(ACCESS_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.sameSite,
    });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.sameSite,
    });
  }
}
