import { IsNotEmpty } from "class-validator";

export class MediaPostDTO {
  @IsNotEmpty()
  readonly name_media
}