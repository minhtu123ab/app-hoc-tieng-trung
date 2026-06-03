import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
    @Query('threadId') threadId?: string,
  ) {
    return this.tutorService.ask(req.user.userId, dto, threadId ?? 'main');
  }

  @Post('chat')
  chat(
    @Req() req: { user: { userId: string } },
    @Body() dto: TutorChatDto,
    @Query('threadId') threadId?: string,
  ) {
    return this.tutorService.chat(req.user.userId, dto, threadId ?? 'main');
  }

  @Get('history')
  history(
    @Req() req: { user: { userId: string } },
    @Query('threadId') threadId?: string,
  ) {
    return this.tutorService.getHistory(req.user.userId, threadId ?? 'main');
  }

  @Get('threads')
  threads(@Req() req: { user: { userId: string } }) {
    return this.tutorService.listThreads(req.user.userId);
  }

  @Post('threads')
  createThread(@Req() req: { user: { userId: string } }) {
    return this.tutorService.createThread(req.user.userId);
  }

  @Delete('history')
  clearHistory(
    @Req() req: { user: { userId: string } },
    @Query('threadId') threadId?: string,
  ) {
    return this.tutorService.clearHistory(req.user.userId, threadId);
  }
}
