import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './public',
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  exports: [],
  providers: [],
})
export class FileHandlerModule {}
