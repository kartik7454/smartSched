import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 🔐 REGISTER USER
  async register(data: {
    name: string;
    email: string;
    password: string;
    roleId: number;
    departmentId?: number;
  }) {
    // check if user already exists
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // create user in DB
    const user = await this.usersService.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      roleId: data.roleId,
      departmentId: data.departmentId,
    });

    // create JWT token immediately after register
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleId,
    };

    return {
      message: 'User registered successfully',
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // 🔐 VALIDATE USER (used by login)
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('NO USER FOUND');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    return user;
  }

  // 🔐 LOGIN USER
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleId,
    };

    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
    };
  }
}
