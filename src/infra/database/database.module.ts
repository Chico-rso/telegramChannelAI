import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProjectBootstrapService } from './project-bootstrap.service';

@Module({
  providers: [PrismaService, ProjectBootstrapService],
  exports: [PrismaService],
})
export class DatabaseModule {}
