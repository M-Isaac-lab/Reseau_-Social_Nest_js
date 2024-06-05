import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { PrismaModule } from './prisma/prisma.module';
import {ConfigModule} from "@nestjs/config";
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal : true}), UserModule, PostModule, CommentModule, PrismaModule, MailerModule],

})
export class AppModule {}
