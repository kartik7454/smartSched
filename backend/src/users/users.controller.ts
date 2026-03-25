import { Controller } from '@nestjs/common';

import {
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: any) {
    // You may want to strongly type createUserDto in a real app
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(+id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @Get()
  findAll() {
    // Since UsersService does not implement findAll, you might need to add it
    // For placeholder:
    throw new NotFoundException('Not implemented');
  }

  @Put(':id')
  update(@Param('id') _id: string, @Body() _updateUserDto: any) {
    void _id;
    void _updateUserDto;
    // You may want to strongly type updateUserDto in a real app
    // UsersService does not implement update, so you might need to add it
    throw new NotFoundException('Not implemented');
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    void _id;
    // UsersService does not implement remove, so you might need to add it
    throw new NotFoundException('Not implemented');
  }
}
