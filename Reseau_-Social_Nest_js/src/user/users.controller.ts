import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Users")
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  getPublicProfile(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getPublicProfile(userId);
  }
}
