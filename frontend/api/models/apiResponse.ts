export type apiResponse<T> = {
  message: T
  next?: string
  error: string | null
}