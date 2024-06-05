import { IsEmail, IsNotEmpty } from "class-validator";

export class Delete_AccountDto {

  @IsNotEmpty()
  readonly password: string

  @IsNotEmpty()
  readonly email : string

}