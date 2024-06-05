import { IsEmail, IsNotEmpty } from "class-validator";

export class Reset_password_ConfirmationDto {

  @IsNotEmpty()
  @IsEmail()
  readonly email : string

  @IsNotEmpty()
  readonly password: string

  @IsNotEmpty()
  readonly code : string
}