export type apiResponse<T> = {
  message: T
  last?: string
  error: string | null
}