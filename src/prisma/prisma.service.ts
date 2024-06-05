import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PrismaService extends PrismaClient {

  constructor(ConfigService : ConfigService) {
    super({
      datasources : {
        db: {
          url : ConfigService.get("DATABASE_URL")
        }
      }
    });
  }

}
