import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { PostService } from "./post.service";
import { CreatePostDto } from "./dto/CreatePost.dto";
import { UpdatePostDto } from "./dto/UpdatePost.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Posts")
@Controller('posts')
export class PostController {
  constructor( private readonly postService : PostService) {
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@Body() createPost : CreatePostDto, @Req() request : Request) {
    const userId = request.user!.userId
    return this.postService.Create(createPost, userId)
  }

  @Get()
  read(@Query() pagination : PaginationQueryDto){
    return this.postService.Read(pagination.page, pagination.limit)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Get('feed')
  feed(@Query() pagination : PaginationQueryDto, @Req() request : Request){
    const userId = request.user!.userId
    return this.postService.Feed(userId, pagination.page, pagination.limit)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Patch(':id')
  update(@Body() updatePost : UpdatePostDto , @Req() request : Request, @Param("id", ParseIntPipe) postId : number){
    const userId = request.user!.userId
    return this.postService.Update(updatePost, postId, userId)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete(':id')
  delete(@Req() request : Request, @Param("id", ParseIntPipe) postId : number){
    const userId = request.user!.userId
    return this.postService.Delete(postId, userId)
  }

}
