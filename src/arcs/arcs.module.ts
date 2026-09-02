import { Module } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { ArcsController } from './arcs.controller';

@Module({
  controllers: [ArcsController],
  providers: [ArcsService],
  exports: [ArcsService],
})
export class ArcsModule {}
