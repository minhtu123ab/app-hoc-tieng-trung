import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
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

export class CreateDeckDto {
  @IsString()
  title!: string;

  @IsString()
  topic!: string;

  @IsEnum(HskLevel)
  hskLevel!: HskLevel;
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
