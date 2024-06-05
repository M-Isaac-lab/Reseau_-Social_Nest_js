import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { PostService } from "./post.service";
import { CreatePostDto } from "./dto/CreatePost.dto";
import { UpdatePostDto } from "./dto/UpdatePost.dto";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Posts")
@Controller('post')
export class PostController {
  constructor( private readonly postService : PostService) {
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post('/create')
  create(@Body() createPost : CreatePostDto, @Req() request : Request) {
    const UserId = request.user["userId"]
    return this.postService.Create(createPost, UserId)
  }

  @Get()
  read(){
    return this.postService.Read()
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Put('/update/:id')
  update(@Body() updatePost : UpdatePostDto , @Req() request : Request, @Param("id", ParseIntPipe) postId : number){
    const userId = request.user["userId"]
    return this.postService.Update(updatePost, postId, userId)

  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Delete('/delete/:id')
  delete(@Req() request : Request, @Param("id", ParseIntPipe) postId : number){
    const userId = request.user["userId"]
    return this.postService.Delete(postId, userId)
  }

}
