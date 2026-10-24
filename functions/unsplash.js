const fetch = require('node-fetch');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  let input;
  try {
    input = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  if (!input || typeof input.query !== 'string' || !input.query.trim() || input.query.length > 200) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid search query' }) };
  }
  if (!process.env.UNSPLASH_API_KEY) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Search unavailable' }) };
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${new URLSearchParams({ query: input.query })}`,
      {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}` },
        redirect: 'error',
        timeout: 10000,
      }
    );
    if (!response.ok) throw new Error('Search failed');
    const { results } = await response.json();
    if (!Array.isArray(results)) throw new Error('Unexpected search response');
    return { statusCode: 200, headers, body: JSON.stringify(results) };
  } catch {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Search unavailable' }) };
  }
};
