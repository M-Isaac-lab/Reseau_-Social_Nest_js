import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { LikeService } from "./like.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Likes")
@Controller('posts')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post(':id/like')
  like(@Param('id', ParseIntPipe) postId: number, @Req() request: Request) {
    const userId = request.user!.userId;
    return this.likeService.like(userId, postId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete(':id/like')
  unlike(@Param('id', ParseIntPipe) postId: number, @Req() request: Request) {
    const userId = request.user!.userId;
    return this.likeService.unlike(userId, postId);
  }

  @Get(':id/likes')
  getLikes(@Param('id', ParseIntPipe) postId: number) {
    return this.likeService.getLikes(postId);
  }
}
