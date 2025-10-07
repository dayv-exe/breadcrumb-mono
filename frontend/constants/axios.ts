import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import Constants from 'expo-constants';

const axiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type allowedTargets = "nickname" | "name" | "bio"
export type editUserInfoData = {
  target: allowedTargets
  payload: string
}

axiosInstance.interceptors.request.use(
  async config => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken

      if (token) {
        const expirationTime = (token.payload.exp ?? 0) * 1000
        const currentTime = Date.now()
        const timeUntilExpiry = expirationTime - currentTime

        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log("token expiring soon, refreshing")
          const refreshedSession = await fetchAuthSession({ forceRefresh: true })
          const refreshedToken = refreshedSession.tokens?.idToken?.toString()
          if (refreshedToken) {
            config.headers.Authorization = `Bearer ${refreshedToken}`
          }
        } else {
          config.headers.Authorization = `Bearer ${token.toString()}`
        }
      }
    } catch (error) {
      console.error("Failed to get auth session:", error)
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default axiosInstance;
