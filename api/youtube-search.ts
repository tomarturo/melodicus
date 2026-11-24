import { youtubeSearch } from './_youtube.js';

/** Search YouTube for videos, with the API key kept on the server. See _youtube.ts. */
export function GET(request: Request): Promise<Response> {
  return youtubeSearch(request, process.env);
}
