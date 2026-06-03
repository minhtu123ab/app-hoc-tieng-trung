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
import { DecksService } from './decks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateVocabDto } from '../common/dtos';

@Controller()
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private decksService: DecksService) {}

  @Get('decks')
  findAll(@Req() req: { user: { userId: string } }) {
    return this.decksService.findAll(req.user.userId);
  }

  @Get('decks/:id')
  findOne(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.decksService.findOne(req.user.userId, id);
  }

  @Delete('decks/:id')
  delete(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.decksService.delete(req.user.userId, id);
  }

  @Post('ai/generate-vocab')
  generateVocab(
    @Req() req: { user: { userId: string } },
    @Body() dto: GenerateVocabDto,
  ) {
    return this.decksService.generateVocab(req.user.userId, dto);
  }

  @Post('decks/:id/enroll')
  enroll(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.decksService.enrollDeck(req.user.userId, id);
  }
}
