export interface FileStorageAdapter {
  upload(file: Express.Multer.File): Promise<{
    storedName: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
  }>;

  delete(storedName: string): Promise<void>;

  getStreamAndHeaders(
    storedName: string,
    rangeHeader?: string,
  ): {
    stream: NodeJS.ReadableStream;
    headers: Record<string, string>;
    statusCode: number;
  };
}
