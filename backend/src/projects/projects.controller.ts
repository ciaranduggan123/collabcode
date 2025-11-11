import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user.sub;
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
    });
  }

  @Post()
  async create(@Req() req: any, @Body() dto: { name: string }) {
    return this.prisma.project.create({
      data: { name: dto.name, ownerId: req.user.sub },
    });
  }

  // 👇 add this
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.sub;
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
      include: { codeFiles: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
