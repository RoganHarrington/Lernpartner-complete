import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentLibrary } from './entities/content-library.entity';
import { ContentMedia } from './entities/content-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContentLibrary, ContentMedia])],
  exports: [TypeOrmModule],
})
export class ContentModule {}
