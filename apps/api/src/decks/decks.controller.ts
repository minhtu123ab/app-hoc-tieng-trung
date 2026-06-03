import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DecksService } from './decks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AddDeckWordsDto,
  CreateDeckDto,
  GenerateVocabDto,
  ImportDeckDto,
  UpdateDeckDto,
} from '../common/dtos';

@Controller()
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private decksService: DecksService) {}

  @Get('decks')
  findAll(@Req() req: { user: { userId: string } }) {
    return this.decksService.findAll(req.user.userId);
  }

  @Post('decks')
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateDeckDto,
  ) {
    return this.decksService.create(req.user.userId, dto);
  }

  @Get('decks/:id')
  findOne(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.decksService.findOne(req.user.userId, id);
  }

  @Patch('decks/:id')
  update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.decksService.update(req.user.userId, id, dto);
  }

  @Get('decks/:id/export')
  exportDeck(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.decksService.exportDeck(req.user.userId, id);
  }

  @Post('decks/import')
  importDeck(
    @Req() req: { user: { userId: string } },
    @Body() body: ImportDeckDto,
  ) {
    return this.decksService.importDeck(req.user.userId, body);
  }

  @Post('decks/:id/words')
  addWords(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: AddDeckWordsDto,
  ) {
    return this.decksService.addWords(req.user.userId, id, dto);
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
