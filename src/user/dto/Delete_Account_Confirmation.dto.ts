import { IsEmail, IsNotEmpty } from "class-validator";

export class Delete_Account_ConfirmationDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email : string

  @IsNotEmpty()
  readonly password: string

  @IsNotEmpty()
  readonly code : string
}