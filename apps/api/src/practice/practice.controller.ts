import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GradePracticeDto } from '../common/dtos';
import { PracticeMode } from '@linguaflow/shared';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private practiceService: PracticeService) {}

  @Get(':mode')
  getQuestions(
    @Req() req: { user: { userId: string } },
    @Param('mode') mode: PracticeMode,
    @Query('limit') limit?: string,
  ) {
    return this.practiceService.getQuestions(
      req.user.userId,
      mode,
      limit ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 500) : 10,
    );
  }

  @Post('grade')
  grade(
    @Req() req: { user: { userId: string } },
    @Body() dto: GradePracticeDto,
  ) {
    return this.practiceService.grade(req.user.userId, dto);
  }

  @Post('session/start')
  startSession(
    @Req() req: { user: { userId: string } },
    @Body('mode') mode: PracticeMode,
  ) {
    return this.practiceService.startSession(req.user.userId, mode);
  }

  @Post('session/:id/end')
  endSession(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { total: number; correct: number },
  ) {
    return this.practiceService.endSession(
      id,
      req.user.userId,
      body.total,
      body.correct,
    );
  }
}
