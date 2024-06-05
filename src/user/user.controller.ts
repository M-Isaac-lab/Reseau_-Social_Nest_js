import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { Reset_passwordDto } from "./dto/reset_password.dto";
import { Reset_password_ConfirmationDto } from "./dto/reset_password_Confirmation.dto";
import { Delete_AccountDto } from "./dto/delete_Account.dto";
import { Delete_Account_ConfirmationDto } from "./dto/Delete_Account_Confirmation.dto";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Authentification")
@Controller('user')
export class UserController {
  constructor( private  readonly userService : UserService ) {

    }

  @Post(`/signup`)
  signup (@Body() signupDto : SignupDto) {
    return this.userService.Signup(signupDto);
  }

  @Post('/signin')
  signin (@Body() signinDto : SigninDto){
    return this.userService.Signin(signinDto)
  }


  @Put('/update')
  update(@Body() reset_password : Reset_passwordDto  ) {
    return this.userService.reset_password(reset_password)
  }

  @Post('/update_confirmation')
  update_confirmation(@Body() reset_password_confirmation : Reset_password_ConfirmationDto ){
    return this.userService.reset_password_confirmation(reset_password_confirmation)
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete('/delete')
  delete(@Body() delete_account : Delete_AccountDto, @Req() request : Request){
    const userid = request.user['userId']
    return this.userService.Delete(userid , delete_account)
}

  @Delete('/delete_confirmation')
  delete_confirmation(@Body() delete_account_confirmation : Delete_Account_ConfirmationDto){
    return this.userService.Delete_Confirmation(delete_account_confirmation)
  }

}
