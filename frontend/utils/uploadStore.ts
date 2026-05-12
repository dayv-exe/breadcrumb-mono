type UploadState =
  | { status: 'pending' }
  | { status: 'uploading'; progress?: number }
  | { status: 'success'; mediaKey: string }
  | { status: 'failed'; error: string; retries: number };