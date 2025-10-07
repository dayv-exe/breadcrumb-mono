import { fetchAuthSession } from "aws-amplify/auth"

export async function GetId(): Promise<string> {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken
    if (!token) {
      return ""
    }
    return String(token.payload.sub) || String(token.payload['sub'])
  } catch (error) {
    console.error("Failed to get auth session:", error)
    return ""
  }
}