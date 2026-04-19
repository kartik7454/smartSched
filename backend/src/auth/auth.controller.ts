import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

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
  async login(@Body() body: { email: string; password: string }) {
    const { access_token, user } = await this.authService.login(
      body.email,
      body.password,
    );
    // Session cookie must be set on the frontend origin (e.g. Next Route Handler), not here —
    // browsers scope Set-Cookie to this API host, so it would not appear on Vercel.
    return {
      success: true,
      user,
      access_token,
    };
  }
}
