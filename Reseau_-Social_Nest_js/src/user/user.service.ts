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
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService : PrismaService,
    private readonly configService : ConfigService,
    private readonly mailerService : MailerService,
    private readonly jwtService : JwtService
  ) {
  }

  private async getOrCreateOtpSecret(userId: number): Promise<string> {
    const user = await this.prismaService.user.findUnique({ where: { userId }, select: { otpSecret: true } });
    if (user?.otpSecret) return user.otpSecret;
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    await this.prismaService.user.update({ where: { userId }, data: { otpSecret: secret } });
    return secret;
  }

  async Signup(signupDto: SignupDto) {
    const {username, email, password} = signupDto
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(user) throw new ConflictException("User already exists")
    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({data : {username, email, password : hash}})
    try {
      await this.mailerService.sendSignupConfirmation(email)
    } catch (e) {
      // Mail sending is non-blocking
    }
    return {data : "User created successfully"}
  }

  async Signin(signinDto: SigninDto) {
    const {email, password} = signinDto
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException("Invalid password")
    const secret = this.configService.get("SECRET_KEY");
    const payload = { sub: user.userId, email: user.email };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m', secret });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d', secret });
    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.prismaService.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });
    return {
      access_token,
      refresh_token,
      user: {
        username: user.username,
        email: user.email,
      }
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const secret = this.configService.get("SECRET_KEY");
      const payload = this.jwtService.verify(dto.refreshToken, { secret });
      const user = await this.prismaService.user.findUnique({ where: { userId: payload.sub } });
      if (!user || !user.refreshToken) throw new UnauthorizedException("Invalid refresh token");
      const isValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
      if (!isValid) throw new UnauthorizedException("Invalid refresh token");
      const newPayload = { sub: user.userId, email: user.email };
      const access_token = this.jwtService.sign(newPayload, { expiresIn: '15m', secret });
      const refresh_token = this.jwtService.sign(newPayload, { expiresIn: '7d', secret });
      const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
      await this.prismaService.user.update({
        where: { userId: user.userId },
        data: { refreshToken: hashedRefreshToken },
      });
      return { access_token, refresh_token };
    } catch (e) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getProfile(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createAt: true,
        updateAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return { data: user };
  }

  async updateProfile(userId: number, dto: { username?: string; bio?: string; avatarUrl?: string }) {
    const user = await this.prismaService.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException("User not found");
    const updated = await this.prismaService.user.update({
      where: { userId },
      data: { ...dto },
      select: {
        userId: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createAt: true,
        updateAt: true,
      },
    });
    return { data: updated };
  }

  async getPublicProfile(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return { data: user };
  }

  async reset_password(reset_password: Reset_passwordDto) {
    const {email, password} = reset_password
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException("Invalid password")

    const otpSecret = await this.getOrCreateOtpSecret(user.userId);
    const code = speakeasy.totp({
      secret: otpSecret,
      digits: 5,
      step: 60 * 15,
      encoding: "base32"
    })

    const url = (this.configService.get("APP_URL") || "http://localhost:3000") + "/auth/reset-password/confirm"
    try {
      await this.mailerService.resetPasswordConfirmation(email, code, url)
    } catch (e) {
      // Mail sending is non-blocking
    }

    return {data : "Password reset email sent"}
  }

  async reset_password_confirmation(reset_password_confirmation: Reset_password_ConfirmationDto) {
    const {email, password, code} = reset_password_confirmation
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")

    const otpSecret = await this.getOrCreateOtpSecret(user.userId);
    const match = speakeasy.totp.verify({
      secret: otpSecret,
      token: code,
      digits: 5,
      step: 60 * 15,
      encoding: "base32"
    })

    if(!match) throw new UnauthorizedException("Invalid verification code")
    const hash = await bcrypt.hash(password, 10)
    await this.prismaService.user.update({where : {email}, data : {password : hash}})

    return {data : "Password updated successfully"}
  }

  async Delete(userId: number, delete_account: Delete_AccountDto) {
    const {password, email} = delete_account
    const user = await this.prismaService.user.findUnique({where : {userId}})
    if(!user) throw new NotFoundException("User not found")
    if(email !== user.email) throw new UnauthorizedException("Email doesn't match")
    const match = await bcrypt.compare(password, user.password)
    if(!match) throw new UnauthorizedException("Invalid password")

    const otpSecret = await this.getOrCreateOtpSecret(user.userId);
    const code = speakeasy.totp({
      secret: otpSecret,
      digits: 5,
      step: 60 * 15,
      encoding: "base32"
    })

    const url = (this.configService.get("APP_URL") || "http://localhost:3000") + "/auth/account/confirm"
    try {
      await this.mailerService.DeleteAccountConfirmation(user.email, code, url)
    } catch (e) {
      // Mail sending is non-blocking
    }

    return {data : "Account deletion email sent"}
  }

  async Delete_Confirmation(userId: number, delete_account_confirmation: Delete_Account_ConfirmationDto) {
    const {email, password, code} = delete_account_confirmation
    const user = await this.prismaService.user.findUnique({where : {email}})
    if(!user) throw new NotFoundException("User not found")
    if(user.userId !== userId) throw new UnauthorizedException("Unauthorized")
    const password_match = await bcrypt.compare(password, user.password)
    if(!password_match) throw new UnauthorizedException("Invalid password")

    const otpSecret = await this.getOrCreateOtpSecret(user.userId);
    const match = speakeasy.totp.verify({
      secret: otpSecret,
      token: code,
      digits: 5,
      step: 60 * 15,
      encoding: "base32"
    })

    if(!match) throw new UnauthorizedException("Invalid verification code")
    await this.prismaService.user.delete({where : {email}})

    return {data : "Account deleted successfully"}
  }
}
