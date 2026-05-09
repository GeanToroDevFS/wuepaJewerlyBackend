import axios from 'axios';

const ACCESS_TOKEN =
  process.env.INSTAGRAM_ACCESS_TOKEN;

const IG_USER_ID =
  process.env.IG_USER_ID;

export const publishProductToInstagram = async (
  imageUrl: string,
  caption: string
) => {

  try {

    const containerResponse = await axios.post(
      `https://graph.facebook.com/v23.0/${IG_USER_ID}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: ACCESS_TOKEN,
      }
    );

    const creationId = containerResponse.data.id;

    const publishResponse = await axios.post(
      `https://graph.facebook.com/v23.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      }
    );

    return publishResponse.data;

  } catch (error) {

    console.error(
      '❌ [INSTAGRAM SERVICE]',
      error
    );

    throw error;
  }
};