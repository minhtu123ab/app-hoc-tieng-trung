import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SentencesService } from './sentences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateSentencesDto } from '../common/dtos';

@Controller()
@UseGuards(JwtAuthGuard)
export class SentencesController {
  constructor(private sentencesService: SentencesService) {}

  @Get('sentence-decks')
  findAll(@Req() req: { user: { userId: string } }) {
    return this.sentencesService.findAll(req.user.userId);
  }

  @Get('sentence-decks/:id')
  findOne(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.sentencesService.findOne(req.user.userId, id);
  }

  @Delete('sentence-decks/:id')
  delete(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.sentencesService.delete(req.user.userId, id);
  }

  @Post('ai/generate-sentences')
  generateSentences(
    @Req() req: { user: { userId: string } },
    @Body() dto: GenerateSentencesDto,
  ) {
    return this.sentencesService.generateSentences(req.user.userId, dto);
  }

  @Post('sentence-decks/:id/enroll')
  enroll(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.sentencesService.enrollDeck(req.user.userId, id);
  }
}
