import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FollowService {
  constructor(private readonly prismaService: PrismaService) {}

  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) throw new ForbiddenException("Cannot follow yourself");

    const targetUser = await this.prismaService.user.findUnique({ where: { userId: followingId } });
    if (!targetUser) throw new NotFoundException("User not found");

    const existing = await this.prismaService.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) throw new ConflictException("Already following");

    await this.prismaService.follow.create({ data: { followerId, followingId } });
    return { data: "User followed" };
  }

  async unfollow(followerId: number, followingId: number) {
    const existing = await this.prismaService.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!existing) throw new NotFoundException("Not following this user");

    await this.prismaService.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { data: "User unfollowed" };
  }

  async getFollowers(userId: number) {
    const user = await this.prismaService.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException("User not found");

    const followers = await this.prismaService.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { userId: true, username: true, avatarUrl: true } } },
    });
    return { data: followers.map(f => f.follower) };
  }

  async getFollowing(userId: number) {
    const user = await this.prismaService.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException("User not found");

    const following = await this.prismaService.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { userId: true, username: true, avatarUrl: true } } },
    });
    return { data: following.map(f => f.following) };
  }
}
