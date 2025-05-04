import { BadRequestException, Injectable } from '@nestjs/common'
import { UsersService } from './users.service'
import { randomBytes, scrypt as _script } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(_script) 

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const users = await this.usersService.find(email)
    
    if (users.length) {
      throw new BadRequestException('Email in use')
    }

    const salt = randomBytes(8).toString('hex')
    const hash = (await scrypt(password, salt, 32)) as Buffer


  }

  signin() {

  }
}