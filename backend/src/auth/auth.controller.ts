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

  // 🔐 LOGIN
  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.login(body.email, body.password);
  }
}
