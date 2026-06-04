import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DecksModule } from './decks/decks.module';
import { SrsModule } from './srs/srs.module';
import { PracticeModule } from './practice/practice.module';
import { TutorModule } from './tutor/tutor.module';
import { SentencesModule } from './sentences/sentences.module';
import { StatsModule } from './stats/stats.module';
import { GeminiModule } from './gemini/gemini.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GeminiModule,
    DecksModule,
    SrsModule,
    PracticeModule,
    TutorModule,
    SentencesModule,
    StatsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
