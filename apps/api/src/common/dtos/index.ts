import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  HskLevel,
  PracticeMode,
  ReviewRating,
} from '@linguaflow/shared';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(HskLevel)
  hskLevel?: HskLevel;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class GenerateVocabDto {
  @IsString()
  topic!: string;

  @IsEnum(HskLevel)
  hskLevel!: HskLevel;

  @IsInt()
  @Min(1)
  @Max(100)
  count!: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(HskLevel)
  hskLevel?: HskLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  dailyGoal?: number;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class DeckWordInputDto {
  @IsString()
  hanzi!: string;

  @IsString()
  pinyin!: string;

  @IsString()
  meaningVi!: string;

  @IsOptional()
  @IsString()
  partOfSpeech?: string | null;

  @IsOptional()
  @IsString()
  exampleHanzi?: string | null;

  @IsOptional()
  @IsString()
  examplePinyin?: string | null;

  @IsOptional()
  @IsString()
  exampleVi?: string | null;

  @IsOptional()
  @IsEnum(HskLevel)
  hskLevel?: HskLevel;
}

export class CreateDeckDto {
  @IsString()
  title!: string;

  @IsString()
  topic!: string;

  @IsEnum(HskLevel)
  hskLevel!: HskLevel;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckWordInputDto)
  words?: DeckWordInputDto[];
}

export class ImportDeckDto {
  @IsString()
  title!: string;

  @IsString()
  topic!: string;

  @IsEnum(HskLevel)
  hskLevel!: HskLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckWordInputDto)
  words!: DeckWordInputDto[];
}

export class AddDeckWordsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckWordInputDto)
  words!: DeckWordInputDto[];
}

export class UpdateDeckDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsEnum(HskLevel)
  hskLevel?: HskLevel;
}

export class StartPracticeSessionDto {
  @IsEnum(PracticeMode)
  mode!: PracticeMode;
}

export class EndPracticeSessionDto {
  @IsInt()
  @Min(0)
  total!: number;

  @IsInt()
  @Min(0)
  correct!: number;
}

export class GenerateSentencesDto {
  @IsString()
  topic!: string;

  @IsEnum(HskLevel)
  hskLevel!: HskLevel;

  @IsInt()
  @Min(1)
  @Max(50)
  count!: number;
}

export class ReviewDto {
  @IsOptional()
  @IsString()
  wordId?: string;

  @IsOptional()
  @IsString()
  sentenceId?: string;

  @IsEnum(ReviewRating)
  rating!: ReviewRating;

  @IsOptional()
  @IsEnum(PracticeMode)
  mode?: PracticeMode;

  @IsOptional()
  isCorrect?: boolean;
}

export class GradePracticeDto {
  @IsEnum(PracticeMode)
  mode!: PracticeMode;

  @IsOptional()
  @IsString()
  wordId?: string;

  @IsOptional()
  @IsString()
  sentenceId?: string;

  @IsString()
  userAnswer!: string;

  @IsString()
  correctAnswer!: string;
}

export class TutorAskDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class TutorChatDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  role?: 'teacher' | 'friend' | 'customer' | 'shopkeeper';
}
