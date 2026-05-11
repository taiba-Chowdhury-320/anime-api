const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'keyword parameter is required'
    });
  }

  try {
    const response = await axios.get(
      'https://tiktok-scraper7.p.rapidapi.com/feed/search',
      {
        params: {
          keywords: keyword,
          region: 'us',
          count: '20',
          cursor: '0',
          publish_time: '0',
          sort_type: '0'
        },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
        }
      }
    );

    const raw = response.data;
    const videos = raw?.data?.videos || [];

    if (videos.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No videos found',
        debug: Object.keys(raw || {}),
        debug2: Object.keys(raw?.data || {})
      });
    }

    const formatted = videos.map(v => ({
      videoUrl: v.play || '',
      title: v.title || keyword,
      author: v.author?.nickname || 'Unknown',
      likes: v.digg_count || 0,
      thumbnail: v.cover || ''
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.response?.data || error.message
    });
  }
};
