import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SrsService } from './srs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewDto } from '../common/dtos';

@Controller('srs')
@UseGuards(JwtAuthGuard)
export class SrsController {
  constructor(private srsService: SrsService) {}

  @Get('due')
  getDue(@Req() req: { user: { userId: string } }) {
    return this.srsService.getDueWords(req.user.userId);
  }

  @Post('review')
  review(
    @Req() req: { user: { userId: string } },
    @Body() dto: ReviewDto,
  ) {
    return this.srsService.review(req.user.userId, dto);
  }
}
