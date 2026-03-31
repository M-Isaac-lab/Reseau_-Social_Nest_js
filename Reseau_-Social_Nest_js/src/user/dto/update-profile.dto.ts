import { IsNotEmpty, IsOptional, IsUrl, MaxLength } from "class-validator";

export class UpdateProfileDto {

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(55)
  readonly username?: string

  @IsOptional()
  @MaxLength(500)
  readonly bio?: string

  @IsOptional()
  @IsUrl()
  readonly avatarUrl?: string

}
