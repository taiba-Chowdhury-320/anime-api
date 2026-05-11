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
    // ScrapTik API - more reliable
    const response = await axios.get('https://scraptik.p.rapidapi.com/search-videos', {
      params: {
        keyword: keyword,
        count: '20',
        offset: '0'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'scraptik.p.rapidapi.com'
      }
    });

    const raw = response.data;
    console.log('RAW:', JSON.stringify(raw).slice(0, 800));

    let videos = [];

    if (raw?.aweme_list) videos = raw.aweme_list;
    else if (raw?.data?.aweme_list) videos = raw.data.aweme_list;
    else if (Array.isArray(raw?.data)) videos = raw.data;
    else if (Array.isArray(raw)) videos = raw;

    const formatted = videos
      .filter(v => v?.video?.play_addr?.url_list?.[0] || v?.play)
      .map(v => ({
        videoUrl: v?.video?.play_addr?.url_list?.[0] || v?.play || '',
        title: v?.desc || keyword,
        author: v?.author?.nickname || 'Unknown',
        likes: v?.statistics?.digg_count || 0,
        views: v?.statistics?.play_count || 0,
        thumbnail: v?.video?.cover?.url_list?.[0] || '',
        duration: v?.video?.duration || 0
      }));

    if (formatted.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No videos found',
        raw_keys: Object.keys(raw || {}),
        keyword
      });
    }

    return res.status(200).json({
      success: true,
      keyword,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};
