const axios = require('axios');

async function searchTikTokVideos(keyword) {
  try {
    const response = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
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
    });

    console.log('API Response:', JSON.stringify(response.data).slice(0, 500));

    // TiKWM different response structure
    const data = response.data;
    let videos = [];

    if (data?.data?.videos) {
      videos = data.data.videos;
    } else if (data?.videos) {
      videos = data.videos;
    } else if (Array.isArray(data?.data)) {
      videos = data.data;
    } else if (Array.isArray(data)) {
      videos = data;
    }

    const formatted = videos
      .filter(v => v.play || v.video?.play_addr?.url_list?.[0])
      .map(v => ({
        videoUrl: v.play || v.video?.play_addr?.url_list?.[0] || '',
        title: v.desc || v.title || keyword,
        author: v.author?.nickname || v.nickname || 'Unknown',
        likes: v.digg_count || v.statistics?.digg_count || 0,
        views: v.play_count || v.statistics?.play_count || 0,
        thumbnail: v.cover || v.video?.cover?.url_list?.[0] || '',
        duration: v.duration || 0
      }));

    return formatted;

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
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
        keyword,
        tip: 'Check Vercel logs for API response details'
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
      error: 'Internal server error',
      message: error.message
    });
  }
};
