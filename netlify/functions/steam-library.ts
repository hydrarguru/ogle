import { handleSteamLibrary } from '../steamLibrary'

export default (request: Request) => handleSteamLibrary(request, { apiKey: process.env.STEAM_API_KEY, fetch })
