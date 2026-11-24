import { youtubeVideo } from './_youtube.js';

/** One video's title, length and thumbnail, with the API key kept on the server. See _youtube.ts. */
export function GET(request: Request): Promise<Response> {
  return youtubeVideo(request, process.env);
}
