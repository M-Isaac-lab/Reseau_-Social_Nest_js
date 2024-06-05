import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CreatePostDto } from "./dto/CreatePost.dto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdatePostDto } from "./dto/UpdatePost.dto";

@Injectable()
export class PostService {
  constructor(private readonly prismaService : PrismaService) {
  }

  async Create(createPost: CreatePostDto, UserId : number) {
    const {userId, title, body} = createPost
    if(userId != UserId) throw new UnauthorizedException("User does not match")
    await this.prismaService.post.create({data : {userId, title, body}})
    return {data : "Post created"}

  }

  async Read() {
    const post = await this.prismaService.post.findMany({
      include : {
        user : {
          select : {
            username : true,
            email : true,
            password : false
          }

        },
        comments : {
          select : {
            user : {
              select : {
                username : true,
                email : true,
                password : false
              }
            }
          }
        }
      }
    })
    return post
  }

  async Update(updatePost: UpdatePostDto, postId: number, userId: number) {
    const post = await this.prismaService.post.findUnique({where : {postId}})
    if (post.userId != userId) throw new UnauthorizedException("User does not match")
    if (!post) throw new NotFoundException("This post does not exist")
    await this.prismaService.post.update({where : {postId} , data : {...updatePost}})
    //await this.prismaService.post.create({where : {Id} , data : {content, title}})
  }

  async Delete(postId: number, userId: number) {
    const post  = await this.prismaService.post.findUnique({where : {postId}})
    if (!post) throw new NotFoundException("Post does not Found")
    if (post.userId != userId) throw new ForbiddenException("Forbidden Action")
    await this.prismaService.post.delete({where : {postId}})
    //await this.prismaService.post.delete({where : {userId}})
    return {data : "Post Deleted"}


  }
}
