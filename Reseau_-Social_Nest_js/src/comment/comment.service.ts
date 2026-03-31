import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommentDto } from "./dto/createComment.dto";
import { UpdateCommentDto } from "./dto/updateComment.dto";

@Injectable()
export class CommentService {
  constructor(
      private readonly prismaService : PrismaService
    ) {
  }

  async GetComment(postId : number) {
    const post = await this.prismaService.post.findUnique({where : {postId}})
    if(!post) throw new NotFoundException("Post not found")
    return await this.prismaService.comment.findMany({
      where : {postId},
      include : {
        user : {
          select : {
            username : true,
            email : true,
          }
        }
      }
    })
  }

  async Create(createComment: CreateCommentDto, userId: number, postId: number) {
    const {content} = createComment
    const post = await this.prismaService.post.findUnique({where : {postId}})
    if(!post) throw new NotFoundException("Post not found")
    await this.prismaService.comment.create({data : {content, userId, postId}})
    return {data : "Comment created"}
  }

  async Delete(userId: number, commentId: number) {
    const comment = await this.prismaService.comment.findUnique({where : {commentId}})
    if(!comment) throw new NotFoundException("Comment not found")
    if(comment.userId !== userId) throw new ForbiddenException("Forbidden action")
    await this.prismaService.comment.delete({where : {commentId}})
    return {data : "Comment deleted"}
  }

  async Update(updateComment : UpdateCommentDto, userId: number, commentId: number) {
    const {content} = updateComment
    const comment = await this.prismaService.comment.findUnique({where : {commentId}})
    if(!comment) throw new NotFoundException("Comment not found")
    if(comment.userId !== userId) throw new ForbiddenException("Forbidden action")
    await this.prismaService.comment.update({where : {commentId} ,  data : {content}})
    return {data : "Comment updated"}
  }
}
