const axios = require('axios');

async function searchTikTokVideos(keyword) {
  try {
    const options = {
      method: 'GET',
      url: 'https://tiktok-scraper7.p.rapidapi.com/feed/search',
      params: {
        keywords: keyword,
        region: 'US',
        count: '20',
        cursor: '0',
        publish_time: '0',
        sort_type: '0'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const videos = response.data?.data?.videos || [];

    const formatted = videos
      .filter(v => v.play)
      .map(v => ({
        videoUrl: v.play,
        title: v.title || keyword,
        author: v.author?.nickname || 'Unknown',
        likes: v.digg_count || 0,
        views: v.play_count || 0,
        thumbnail: v.cover || '',
        duration: v.duration || 0
      }));

    return formatted;

  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'keyword parameter is required',
      example: '/api?keyword=naruto anime edit'
    });
  }

  try {
    const videos = await searchTikTokVideos(keyword);

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No videos found',
        keyword
      });
    }

    return res.status(200).json({
      success: true,
      keyword,
      count: videos.length,
      data: videos
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
