import { 
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable

} from '@nestjs/common'
import { UsersService } from '../users.service'

export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private usersService: UsersService) {}
}