import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguagePack } from './entities/language-pack.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LanguagePack])],
  exports: [TypeOrmModule],
})
export class LanguagesModule {}
