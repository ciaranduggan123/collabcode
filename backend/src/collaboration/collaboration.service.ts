import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  // In-memory cache of the latest code per project
  private cache = new Map<number, string>();

  constructor(private prisma: PrismaService) {}

  /**
   * Update the in-memory cache whenever a user edits code
   */
  updateInMemory(projectId: number, content: string) {
    this.cache.set(projectId, content);
  }

  /**
   * Fetch the most recent saved code from the database
   */
  async getLatestCode(projectId: number) {
    const file = await this.prisma.codeFile.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return file ? file.content : '';
  }

  /**
   * Save cached project code to the database
   */
  async persistChanges() {
    for (const [projectId, content] of this.cache.entries()) {
      try {
        await this.prisma.codeFile.upsert({
          where: { projectId },
          update: { content },
          create: {
            projectId,
            filename: 'main.ts',
            content,
          },
        });
        this.logger.log(`💾 Saved code for project ${projectId}`);
      } catch (err) {
        this.logger.error(`❌ Failed to persist project ${projectId}: ${err.message}`);
      }
    }
  }

  /**
   * Run auto-persistence every 10 seconds
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async autoPersist() {
    await this.persistChanges();
  }
}
