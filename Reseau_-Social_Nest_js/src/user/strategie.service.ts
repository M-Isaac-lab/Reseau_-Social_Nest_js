import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

type Payload = {
  sub : number,
  email : string
}
@Injectable()
export class JwtStrategie extends PassportStrategy(Strategy) {
  constructor(configService : ConfigService, private readonly prismaService : PrismaService) {
    super({
      jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey : configService.get('SECRET_KEY'),
      ignoreExpiration : false
    });

  }

  async validate(payload : Payload){
    const user = await this.prismaService.user.findUnique({
      where : {email : payload.email},
      select : {
        userId : true,
        username : true,
        email : true,
        createAt : true,
        updateAt : true
      }
    })
    if(!user) throw new UnauthorizedException("Unauthorized")
    return user;
  }

}