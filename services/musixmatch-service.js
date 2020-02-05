const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');

function getTrackData(trackTitle, artistName, response) {
  let url = new URL('https://api.musixmatch.com/ws/1.1/track.search');
  let params = {
    apikey: process.env.MUSIXMATCH_API_KEY,
    q_artist: artistName,
    q_track: trackTitle,
    s_artist_rating: 'desc'
  };
  url.search = new URLSearchParams(params).toString();

  let trackData = fetch(url)
    .then(response => response.json())
    .catch(error => errorResponse(503, error, response))

  return trackData
}

function errorResponse(status, message, response) {
  response.status(status).json({
    status: status,
    error_message: message
  });
}

module.exports = {
  getTrackData: getTrackData
}
