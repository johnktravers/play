const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const ResponseObj = require('../pojos/responseObj');


async function getTrackData(trackTitle, artistName) {
  let url = new URL('https://api.musixmatch.com/ws/1.1/track.search');
  let params = {
    apikey: process.env.MUSIXMATCH_API_KEY,
    q_artist: artistName,
    q_track: trackTitle,
    s_artist_rating: 'desc'
  };
  url.search = new URLSearchParams(params).toString();

  let trackResponse = await fetch(url);
  let trackData = await trackResponse.json();

  if (validResponse(trackData)) {
    return new ResponseObj(200, trackData);
  } else {
    let message = 'No track found. Please check track title and artist name and try again.'
    return new ResponseObj(400, message);
  }
}

function validResponse(data) {
  return (data.message.body.track_list.length) ? true : false;
}

module.exports = {
  getTrackData: getTrackData
}
