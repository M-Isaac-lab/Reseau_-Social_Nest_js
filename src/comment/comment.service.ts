import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { CreateCommentDto } from "./dto/createComment.dto";
import { DeleteCommentDto } from "../post/dto/deleteComment.dto";
import { UpdateCommentDto } from "./dto/updateComment.dto";

@Injectable()
export class CommentService {
  constructor(
      private readonly prismaService : PrismaService
    ) {
  }
  async GetComment(postId : number) {

    const post = await this.prismaService.post.findUnique({where : {postId}})
    if(!post) throw new NotFoundException("Post not find")
    return await this.prismaService.comment.findMany({where : {postId}})
  }


  async Create(createComment: CreateCommentDto, userId: any) {
    const {postId, content} = createComment
    const post = await this.prismaService.post.findUnique({where : {postId}})
    if(!post) throw new NotFoundException("Post not found")
    await this.prismaService.comment.create({data : {content, userId, postId}})
    return {data : "comment create"}
  }


  async Delete(deleteComment: DeleteCommentDto, userId: any, commentId: number) {
    const {postId} = deleteComment
    const comment = await this.prismaService.comment.findUnique({where : {commentId}})
    if(!comment) throw new NotFoundException("Comment Not Found")
    if(comment.postId != postId) throw new UnauthorizedException("Unauthorized")
    if(comment.userId != userId) throw new UnauthorizedException("Unauthorised")
    await this.prismaService.comment.delete({where : {commentId}})

    return {date : "Comment Deleted"}

  }

  async Update(updateComment : UpdateCommentDto, userId: any, commentId: number) {
    const {content, postId} = updateComment
    const comment = await this.prismaService.comment.findUnique({where : {commentId}})
    if(!comment) throw new NotFoundException("Comment Not Found")
    if(comment.postId != postId) throw new UnauthorizedException("Unauthorized")
    if(comment.userId != userId) throw new UnauthorizedException("Unauthorised")
    await this.prismaService.comment.update({where : {commentId} ,  data : {content}})
    return {data : "Content Update"}
  }
}
