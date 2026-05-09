import axios from 'axios';

const ACCESS_TOKEN =
  process.env.INSTAGRAM_ACCESS_TOKEN!;

const IG_USER_ID =
  process.env.IG_USER_ID!;

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  media_type: string;
  timestamp: string;
}

export async function getInstagramPosts() {

  const response = await axios.get(
    `https://graph.facebook.com/v23.0/${IG_USER_ID}/media`,
    {
      params: {
        fields:
          'id,caption,media_url,media_type,timestamp',

        access_token: ACCESS_TOKEN,
      },
    }
  );

  return response.data.data as InstagramPost[];
}