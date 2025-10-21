export type apiResponse<T> = {
  message: T
  error: string | null
}