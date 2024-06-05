import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePostDto {

  @IsNotEmpty()
  readonly userId : number

  @IsNotEmpty()
  @IsOptional()
  readonly body? : string

  @IsNotEmpty()
  @IsOptional()
  readonly title? : string


}