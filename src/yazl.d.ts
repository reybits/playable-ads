declare module 'yazl' {
  import { Readable } from 'stream';

  class ZipFile {
    outputStream: Readable;
    addBuffer(buffer: Buffer, metadataPath: string): void;
    addFile(realPath: string, metadataPath: string): void;
    end(): void;
  }

  export { ZipFile };
}
