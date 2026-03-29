import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningItem } from './entities/learning-item.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { ReviewArtifact } from './entities/review-artifact.entity';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningItem,
      ReviewHistory,
      ReviewArtifact,
      AnalyticsSnapshot,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class LearningModule {}
