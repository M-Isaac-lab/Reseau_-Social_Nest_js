import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { Request } from "express";
import { CreateCommentDto } from "./dto/createComment.dto";
import { AuthGuard } from "@nestjs/passport";
import { DeleteCommentDto } from "../post/dto/deleteComment.dto";
import { UpdateCommentDto } from "./dto/updateComment.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Comments")
@Controller('comment')
export class CommentController {
  constructor( private readonly commentService : CommentService) {
  }

  @Get("/:id")
  getComment(@Param("id", ParseIntPipe) postId : number) {
    return this.commentService.GetComment(postId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("create")
  create(@Req() request : Request , @Body() createComment : CreateCommentDto ){
    const userId = request.user['userId']
    return this.commentService.Create(createComment, userId)

  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete("delete/:id")
  delete(@Body() deleteComment : DeleteCommentDto, @Param("id", ParseIntPipe) commentId : number , @Req() request : Request ){
    const userId = request.user['userId']
    return this.commentService.Delete(deleteComment, userId, commentId)

  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Put("update/:id")
  uptade(@Body() updateComment : UpdateCommentDto, @Param("id", ParseIntPipe) commentId : number , @Req() request : Request ){
    const userId = request.user['userId']
    return this.commentService.Update(updateComment, userId, commentId)

  }



}
