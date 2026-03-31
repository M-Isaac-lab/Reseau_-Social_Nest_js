import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LikeService {
  constructor(private readonly prismaService: PrismaService) {}

  async like(userId: number, postId: number) {
    const post = await this.prismaService.post.findUnique({ where: { postId } });
    if (!post) throw new NotFoundException("Post not found");

    const existing = await this.prismaService.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) throw new ConflictException("Already liked");

    await this.prismaService.like.create({ data: { userId, postId } });
    return { data: "Post liked" };
  }

  async unlike(userId: number, postId: number) {
    const existing = await this.prismaService.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!existing) throw new NotFoundException("Like not found");

    await this.prismaService.like.delete({
      where: { userId_postId: { userId, postId } },
    });
    return { data: "Post unliked" };
  }

  async getLikes(postId: number) {
    const post = await this.prismaService.post.findUnique({ where: { postId } });
    if (!post) throw new NotFoundException("Post not found");

    const [likes, count] = await Promise.all([
      this.prismaService.like.findMany({
        where: { postId },
        include: { user: { select: { userId: true, username: true } } },
      }),
      this.prismaService.like.count({ where: { postId } }),
    ]);

    return { data: { likes, count } };
  }
}
