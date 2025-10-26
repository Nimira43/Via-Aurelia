import { Test } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from './users.service'
import { User } from './user.entity'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { randomBytes, scrypt as _scrypt } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(_scrypt)

describe('AuthService', () => {
  let service: AuthService
  let fakeUsersService: Partial<UsersService>

  beforeEach(async () => {
    const users: User[] = []

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter(user => user.email === email)
        return Promise.resolve(filteredUsers)
      },
      create: (
        email: string, 
        password: string
      ) => {
        const user = {
          id: Math.floor(Math.random() * 999999), 
          email, 
          password
        } as User
        users.push(user)
        return Promise.resolve(user)
      } 
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
        { email: 'lenny@cat.com', password: 'password'} as User, 
      ])
    await expect(
      service.signin('nonsense.com', 'passwodr'),
    ).rejects.toThrow(BadRequestException)
  })
  
  it('returns a user if correct password is provided', async () => {
    // const salt = randomBytes(8).toString('hex')
    // const hash = (await scrypt('password', salt, 32)) as Buffer
    // const result = salt + '.' + hash.toString('hex')

    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     { email: 'lenny@cat.com', password: result } as User,
    //   ])

    await service.signup('newuser2@new.com', 'password')
    const user = await service.signin('newuser2@new.com.com', 'password123')
    expect(user).toBeDefined()
  })

})
