import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule} from "@nestjs/jwt";
import { JwtStrategie } from "./strategie.service";

@Module({
  imports: [
    JwtModule.register({
    }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategie]
})
export class UserModule {}
