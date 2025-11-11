import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
    const key = process.env.OPENAI_API_KEY;
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  async reviewProject(projectId: number) {
    const file = await this.prisma.codeFile.findFirst({ where: { projectId } });
    if (!file) throw new Error('No code found for this project');

    // If no API key, return a mock review so the flow still works
    if (!this.openai) {
      this.logger.warn('OPENAI_API_KEY missing — returning mock review');
      return this.prisma.codeReview.create({
        data: {
          projectId,
          summary: 'Mock: Overall code is readable; consider adding validation & tests.',
          suggestions: {
            items: [
              { type: 'style', message: 'Add semicolons consistently.' },
              { type: 'robustness', message: 'Validate function inputs.' },
              { type: 'testing', message: 'Add unit tests for edge cases.' },
            ],
          },
        },
      });
    }

    const prompt = `
You are a senior engineer. Review the TypeScript code below and return:
- A short summary
- 3–5 concrete suggestions

Code:
${file.content}
`.trim();

    let text = 'No response';
    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      text = res.choices[0]?.message?.content ?? text;
    } catch (err: any) {
      this.logger.error('OpenAI call failed:', err?.message || err);
      // fallback to mock if API call fails
      text = 'AI temporarily unavailable. Consider adding validation, error handling, and tests.';
    }

    return this.prisma.codeReview.create({
      data: {
        projectId,
        summary: text.split('\n').slice(0, 3).join(' ').slice(0, 220),
        suggestions: { fullReview: text },
      },
    });
  }
}

