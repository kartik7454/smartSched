import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 🔐 REGISTER
  @Post('register')
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      roleId: number;
      departmentId?: number;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const { access_token, user } = await this.authService.login(
      body.email,
      body.password,
    );

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 🔥 IMPORTANT (not strict)
      path: '/',
    });

    return res.json({
      success: true,
      user,
      access_token,
    });
  }
  
}
