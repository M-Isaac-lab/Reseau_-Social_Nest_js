import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePostDto {

  @IsNotEmpty()
  readonly title!: string

  @IsOptional()
  @IsNotEmpty()
  readonly body?: string

}
