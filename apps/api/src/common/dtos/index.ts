import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
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
  count!: number;
}

export class ReviewDto {
  @IsString()
  wordId!: string;

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
