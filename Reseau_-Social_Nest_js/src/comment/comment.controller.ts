import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { Request } from "express";
import { CreateCommentDto } from "./dto/createComment.dto";
import { AuthGuard } from "@nestjs/passport";
import { UpdateCommentDto } from "./dto/updateComment.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Comments")
@Controller()
export class CommentController {
  constructor( private readonly commentService : CommentService) {
  }

  @Get("posts/:postId/comments")
  getComments(@Param("postId", ParseIntPipe) postId : number) {
    return this.commentService.GetComment(postId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("posts/:postId/comments")
  create(@Param("postId", ParseIntPipe) postId : number, @Req() request : Request, @Body() createComment : CreateCommentDto){
    const userId = request.user!.userId
    return this.commentService.Create(createComment, userId, postId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete("comments/:id")
  delete(@Param("id", ParseIntPipe) commentId : number, @Req() request : Request){
    const userId = request.user!.userId
    return this.commentService.Delete(userId, commentId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Patch("comments/:id")
  update(@Body() updateComment : UpdateCommentDto, @Param("id", ParseIntPipe) commentId : number, @Req() request : Request){
    const userId = request.user!.userId
    return this.commentService.Update(updateComment, userId, commentId)
  }

}
