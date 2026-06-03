import { Module } from '@nestjs/common';
import { SrsService } from './srs.service';
import { SrsController } from './srs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService],
})
export class SrsModule {}
