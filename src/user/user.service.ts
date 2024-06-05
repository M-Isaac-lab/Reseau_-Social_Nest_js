import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { SignupDto } from "./dto/signup.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt"
import * as speakeasy from "speakeasy"
import { MailerService } from "../mailer/mailer.service";
import { SigninDto } from "./dto/signin.dto";
import { JwtService } from "@nestjs/jwt";
import { Reset_passwordDto } from "./dto/reset_password.dto";
import { Reset_password_ConfirmationDto } from "./dto/reset_password_Confirmation.dto";
import { Delete_AccountDto } from "./dto/delete_Account.dto";
import { Delete_Account_ConfirmationDto } from "./dto/Delete_Account_Confirmation.dto";
@Injectable()
export class UserService {
  constructor(
    private readonly prismaService : PrismaService,
    private readonly configService : ConfigService,
    private readonly mailerService : MailerService,
    private readonly jwtService : JwtService
  ) {
  }


  async Signup(signupDto: SignupDto) {
    const {username, email, password} = signupDto
      const user =  await this.prismaService.user.findUnique({where : {email}})
    if(user) throw new ConflictException("Are already exist")
    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({data : {username, email, password : hash}})
    try{
      await this.mailerService.sendSignupConfirmation(email)
    } catch (e) {
      console.log("Mail not send", )
    }
    return {data : "User Create"}


  }

  async Signin(signinDto: SigninDto) {
    const {email , password} = signinDto
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException('Password is false')
    const payload = { sub: user.userId, email: user.email };
      const access_token = this.jwtService.sign(payload, {expiresIn : '2h', secret : this.configService.get("SECRET_KEY")})
    return {
        token : access_token,
        user : {
          username : user.username,
          email : user.email
    }
    }


  }

  async reset_password(reset_password: Reset_passwordDto) {
    const {email, password} = reset_password
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException('Password is false')
    const code = speakeasy.totp({
      secret: this.configService.get("OTP_CODE"),
      digits : 5,
      step : 60 * 15,
      encoding : "base32"
    })

    const url = "http://localohst:3000/user/update_confirmation"
    try{
      await this.mailerService.resetPasswordConfirmation(email, code, url)
    } catch (e) {
      console.log("Mail not send", )
    }

    return {data : "reset password has been send"}


  }

  async reset_password_confirmation(reset_password_confirmation: Reset_password_ConfirmationDto) {
    const {email, password, code} = reset_password_confirmation
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")

    const match = speakeasy.totp.verify({
      secret : this.configService.get("OTP_CODE"),
      token : code,
      digits : 5,
      step : 60 * 15,
      encoding : "base32"
    })

    if(!match) throw new UnauthorizedException("OTP not corresponding")
    const hash = await bcrypt.hash(password, 10)
    await this.prismaService.user.update({where : {email}, data : {password : hash}})

    return {data : "password was update"}
  }

  async Delete(userId : number , delete_account: Delete_AccountDto) {
    const {password, email} = delete_account
    const user = await this.prismaService.user.findUnique({where : {userId}})
    if(!user) throw new NotFoundException("User not found")
    if(email != user.email) throw new UnauthorizedException("Email doesn't match")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException('Password is false')
    const code = speakeasy.totp({
      secret: this.configService.get("OTP_CODE"),
      digits : 5,
      step : 60 * 15,
      encoding : "base32"
    })

    const url = "http://localohst:3000/user/delete_confirmation"
    try{
      await this.mailerService.DeleteAccountConfirmation(user.email, code, url)
    } catch (e) {
      console.log("Mail not send", )
    }

    return {data : "delet accound mail has been send"}
  }

  async Delete_Confirmation(delete_account_confirmation: Delete_Account_ConfirmationDto) {
    const {email, password, code} = delete_account_confirmation
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    const password_match = await bcrypt.compare(password, user.password)
    if(!password_match) throw new UnauthorizedException('Password is false')
    const match = speakeasy.totp.verify({
      secret : this.configService.get("OTP_CODE"),
      token : code,
      digits : 5,
      step : 60 * 15,
      encoding : "base32"
    })

    if(!match) throw new UnauthorizedException("OTP not corresponding")
    const hash = await bcrypt.hash(password, 10)
    await this.prismaService.user.delete({where : {email}})

    return {data : "Account was deleted"}
  }
}
