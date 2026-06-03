import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SrsModule } from '../srs/srs.module';

@Module({
  imports: [PrismaModule, SrsModule],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
