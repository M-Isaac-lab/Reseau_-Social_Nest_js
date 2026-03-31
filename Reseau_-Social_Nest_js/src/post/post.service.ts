import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreatePostDto } from "./dto/CreatePost.dto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdatePostDto } from "./dto/UpdatePost.dto";

@Injectable()
export class PostService {
  constructor(private readonly prismaService : PrismaService) {
  }

  async Create(createPost: CreatePostDto, userId : number) {
    const {title, body = ''} = createPost
    await this.prismaService.post.create({data : {userId, title, body}})
    return {data : "Post created"}
  }

  async Read(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prismaService.post.findMany({
        skip,
        take: limit,
        orderBy: { postId: 'desc' },
        include : {
          user : {
            select : {
              username : true,
              email : true,
              avatarUrl : true,
            }
          },
          comments : {
            include : {
              user : {
                select : {
                  username : true,
                  email : true,
                  avatarUrl : true,
                }
              }
            }
          },
          _count : {
            select : { likes : true }
          }
        }
      }),
      this.prismaService.post.count(),
    ]);
    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  async Feed(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const following = await this.prismaService.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    const [posts, total] = await Promise.all([
      this.prismaService.post.findMany({
        where: { userId: { in: followingIds } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, email: true, avatarUrl: true } },
          comments: { include: { user: { select: { username: true, avatarUrl: true } } } },
          _count: { select: { likes: true } },
        },
      }),
      this.prismaService.post.count({ where: { userId: { in: followingIds } } }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async Update(updatePost: UpdatePostDto, postId: number, userId: number) {
    const post = await this.prismaService.post.findUnique({where : {postId}})
    if (!post) throw new NotFoundException("Post not found")
    if (post.userId !== userId) throw new ForbiddenException("Forbidden action")
    await this.prismaService.post.update({where : {postId} , data : {...updatePost}})
    return {data : "Post updated"}
  }

  async Delete(postId: number, userId: number) {
    const post  = await this.prismaService.post.findUnique({where : {postId}})
    if (!post) throw new NotFoundException("Post not found")
    if (post.userId !== userId) throw new ForbiddenException("Forbidden action")
    await this.prismaService.post.delete({where : {postId}})
    return {data : "Post deleted"}
  }
}
