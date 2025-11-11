import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(userId: number, name: string) {
    return this.prisma.project.create({
      data: {
        name,
        ownerId: userId,
        members: { connect: { id: userId } }, // owner is also a member
      },
    });
  }

  async listUserProjects(userId: number) {
    return this.prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: { owner: true, members: true },
    });
  }

  async joinProject(userId: number, projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const already = await this.prisma.project.findFirst({
      where: { id: projectId, members: { some: { id: userId } } },
    });
    if (already) throw new ForbiddenException('Already joined');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { members: { connect: { id: userId } } },
      include: { members: true },
    });
  }
}
