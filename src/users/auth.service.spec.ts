import { Test } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from './users.service'
import { User } from './user.entity'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('AuthService', () => {
  let service: AuthService
  let fakeUsersService: Partial<UsersService>

  beforeEach( async () => {
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) => Promise.resolve({
        id: 1,
        email,
        password
      } as User) 
    }

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined()
  })

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('lenny@cat.com', '12345678')
    expect(user.password).not.toEqual('12345678')

    const [salt, hash] = user.password.split('.')
    expect(salt).toBeDefined()
    expect(hash).toBeDefined()
  })

  it('throws an error if the user signs up with an email that is in use', async () => {
    fakeUsersService.find = () => Promise.resolve([{ id: 1, email: 'a', password: '1' } as User])
    await expect(service.signup('lenny@cat.com', '12345678')).rejects.toThrow(
      BadRequestException
    ) 
  })

  it('throws if signin is called with an unused email', async () => {
    await expect (
      service.signin('nonsense.com', 'password'),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () => 
      Promise.resolve([
        { email: 'lenny@cat.com', password: 'thisiswrong'} as User, 
      ])
    await expect(
      service.signin('nonsense.com', 'passwodr'),
    ).rejects.toThrow(BadRequestException)
  })
})
