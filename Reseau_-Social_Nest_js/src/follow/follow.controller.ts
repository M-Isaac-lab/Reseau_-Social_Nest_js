import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { FollowService } from "./follow.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Follow")
@Controller('users')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post(':id/follow')
  follow(@Param('id', ParseIntPipe) followingId: number, @Req() request: Request) {
    const followerId = request.user!.userId;
    return this.followService.follow(followerId, followingId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete(':id/follow')
  unfollow(@Param('id', ParseIntPipe) followingId: number, @Req() request: Request) {
    const followerId = request.user!.userId;
    return this.followService.unfollow(followerId, followingId);
  }

  @Get(':id/followers')
  getFollowers(@Param('id', ParseIntPipe) userId: number) {
    return this.followService.getFollowers(userId);
  }

  @Get(':id/following')
  getFollowing(@Param('id', ParseIntPipe) userId: number) {
    return this.followService.getFollowing(userId);
  }
}
