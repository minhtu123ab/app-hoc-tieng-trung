import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  EndPracticeSessionDto,
  GradePracticeDto,
  StartPracticeSessionDto,
} from '../common/dtos';
import { PracticeMode } from '@linguaflow/shared';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private practiceService: PracticeService) {}

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
    @Body() dto: StartPracticeSessionDto,
  ) {
    return this.practiceService.startSession(req.user.userId, dto.mode);
  }

  @Post('session/:id/end')
  endSession(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: EndPracticeSessionDto,
  ) {
    return this.practiceService.endSession(
      id,
      req.user.userId,
      dto.total,
      dto.correct,
    );
  }

  @Get(':mode')
  getQuestions(
    @Req() req: { user: { userId: string } },
    @Param('mode', new ParseEnumPipe(PracticeMode)) mode: PracticeMode,
    @Query('limit') limit?: string,
    @Query('deckId') deckId?: string,
    @Query('scope') scope?: string,
    @Query('source') source?: string,
    @Query('sentenceDeckId') sentenceDeckId?: string,
  ) {
    const parsedLimit = limit
      ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 500)
      : 10;
    const safeScope = scope === 'due' ? 'due' : 'all';
    const safeSource = source === 'sentences' ? 'sentences' : 'words';
    return this.practiceService.getQuestions(
      req.user.userId,
      mode,
      parsedLimit,
      deckId,
      safeScope,
      safeSource,
      sentenceDeckId,
    );
  }
}
