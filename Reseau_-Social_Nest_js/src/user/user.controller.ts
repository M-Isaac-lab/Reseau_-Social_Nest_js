import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { UserService } from "./user.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { Reset_passwordDto } from "./dto/reset_password.dto";
import { Reset_password_ConfirmationDto } from "./dto/reset_password_Confirmation.dto";
import { Delete_AccountDto } from "./dto/delete_Account.dto";
import { Delete_Account_ConfirmationDto } from "./dto/Delete_Account_Confirmation.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.userService.Signup(signupDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this.userService.Signin(signinDto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refreshToken(refreshTokenDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Get('profile')
  getProfile(@Req() request: Request) {
    const userId = request.user!.userId;
    return this.userService.getProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Patch('profile')
  updateProfile(@Body() dto: UpdateProfileDto, @Req() request: Request) {
    const userId = request.user!.userId;
    return this.userService.updateProfile(userId, dto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: Reset_passwordDto) {
    return this.userService.reset_password(resetPasswordDto);
  }

  @Post('reset-password/confirm')
  resetPasswordConfirm(@Body() dto: Reset_password_ConfirmationDto) {
    return this.userService.reset_password_confirmation(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete('account')
  deleteAccount(@Body() deleteAccountDto: Delete_AccountDto, @Req() request: Request) {
    const userId = request.user!.userId;
    return this.userService.Delete(userId, deleteAccountDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete('account/confirm')
  deleteAccountConfirm(@Body() dto: Delete_Account_ConfirmationDto, @Req() request: Request) {
    const userId = request.user!.userId;
    return this.userService.Delete_Confirmation(userId, dto);
  }
}
