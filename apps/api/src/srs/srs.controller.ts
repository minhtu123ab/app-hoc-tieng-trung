import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SrsService } from './srs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewDto } from '../common/dtos';
import type { SrsDueKind } from '@linguaflow/shared';

@Controller('srs')
@UseGuards(JwtAuthGuard)
export class SrsController {
  constructor(private srsService: SrsService) {}

  @Get('due')
  getDue(
    @Req() req: { user: { userId: string } },
    @Query('kind') kind?: SrsDueKind,
  ) {
    return this.srsService.getDue(req.user.userId, kind ?? 'words');
  }

  @Post('review')
  review(
    @Req() req: { user: { userId: string } },
    @Body() dto: ReviewDto,
  ) {
    if (dto.sentenceId) {
      return this.srsService.reviewSentence(req.user.userId, dto);
    }
    return this.srsService.review(req.user.userId, dto);
  }
}
