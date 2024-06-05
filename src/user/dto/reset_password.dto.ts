import { IsEmail, IsNotEmpty } from "class-validator";

export class Reset_passwordDto {
  @IsNotEmpty()
  @IsEmail()
  email : string

  @IsNotEmpty()
  password : string
}