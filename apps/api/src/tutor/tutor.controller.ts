import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TutorAskDto, TutorChatDto } from '../common/dtos';

@Controller('tutor')
@UseGuards(JwtAuthGuard)
export class TutorController {
  constructor(private tutorService: TutorService) {}

  @Post('ask')
  ask(
    @Req() req: { user: { userId: string } },
    @Body() dto: TutorAskDto,
  ) {
    return this.tutorService.ask(req.user.userId, dto);
  }

  @Post('chat')
  chat(
    @Req() req: { user: { userId: string } },
    @Body() dto: TutorChatDto,
  ) {
    return this.tutorService.chat(req.user.userId, dto);
  }

  @Get('history')
  history(@Req() req: { user: { userId: string } }) {
    return this.tutorService.getHistory(req.user.userId);
  }
}
