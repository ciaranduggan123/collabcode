import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { CollaborationGateway } from './collaboration/collaboration.gateway';
import { CollaborationModule } from './collaboration/collaboration.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    CollaborationModule,
    AIModule,
  ],
  providers: [CollaborationGateway],
})
export class AppModule {}
















