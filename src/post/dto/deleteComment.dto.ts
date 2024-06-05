import { IsNotEmpty } from "class-validator";

export class DeleteCommentDto {

  @IsNotEmpty()
  readonly postId : number


}