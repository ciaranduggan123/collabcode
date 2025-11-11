import { Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';


@Controller('projects')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Post(':id/review')
  review(@Param('id', ParseIntPipe) id: number) {
    return this.ai.reviewProject(id);
  }
}


