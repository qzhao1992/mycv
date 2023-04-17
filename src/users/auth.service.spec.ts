import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;
    let fakeUsersService: Partial<UsersService>;

    beforeEach(async() => {
         //create a fake copy of the service
         const users: User[] = []
        fakeUsersService = {
            find: (email: string) => {
              const filteredUsers = users.filter(user => user.email === email)
              return Promise.resolve(filteredUsers);
            },
            create: (email: string, password: string) => {
              const user = ({id: Math.floor(Math.random() * 999999), email, password});
              users.push(user);
              return Promise.resolve(user);
            }
            // Promise.resolve({id:1, email, password} as User),
        }
        const module = await Test.createTestingModule({
            providers:[AuthService, {provide: UsersService, useValue: fakeUsersService}]
        }).compile();
    
        service = module.get(AuthService); 
    })
    
    it('can create an instance of auth service', async() =>{
        expect(service).toBeDefined();
    })

    it('creates a new user with a salted and hashed password', async()=>{
        const user = await service.signup('asdf@asdf.com', 'asdf');

        expect(user.password).not.toEqual('asdf');
        const [salt, hash] = user.password.split('.');
        expect(salt).toBeDefined();
        expect(hash).toBeDefined();

    })

    it('throws an error if user signs up with email that is in use', async () => {
        fakeUsersService.find = () => Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
        await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
          BadRequestException,
        );
    });

    it('throws if signin is called with an unused email', async () => {
        await expect(
          service.signin('asdflkj@asdlfkj.com', 'passdflkj'),
        ).rejects.toThrow(NotFoundException);
    });

    it('throws if an invalid password is provided', async () => {
      await service.signup('asdf@asdf.com', 'mypassword');
        await expect(
          service.signin('asdf@asdf.com', 'passowrd'),
        ).rejects.toThrow(BadRequestException);
    });

    it('returns a user if correct password is provided', async()=>{
      await service.signup('asdf@asdf.com', 'mypassword');

        const user = await service.signin('asdf@asdf.com', 'mypassword');
        expect(user).toBeDefined();
        
    })

    it('throws an error if user signs up with email that is in use', async () => {
      await service.signup('asdf@asdf.com', 'asdf');
      await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
        BadRequestException,
      );
    });
   
    it('throws if signin is called with an unused email', async () => {
      await expect(
        service.signin('asdflkj@asdlfkj.com', 'passdflkj'),
      ).rejects.toThrow(NotFoundException);
    });
   
    it('throws if an invalid password is provided', async () => {
      await service.signup('laskdjf@alskdfj.com', 'password');
      await expect(
        service.signin('laskdjf@alskdfj.com', 'laksdlfkj'),
      ).rejects.toThrow(BadRequestException);
    });

    
});

