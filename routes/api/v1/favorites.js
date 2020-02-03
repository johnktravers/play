const dotenv = require('dotenv').config();
var express = require('express');
var router = express.Router();

const Track = require('../../../pojos/track');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../../knexfile')[environment];
const database = require('knex')(configuration);
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');

router.post('/', async (request, response) => {
  if (request.body.title && request.body.artistName) {
    let trackTitle = request.body.title;
    let artistName = request.body.artistName;

    let url = new URL('https://api.musixmatch.com/ws/1.1/track.search');
    let params = {
      apikey: process.env.MUSIXMATCH_API_KEY,
      q_artist: artistName,
      q_track: trackTitle,
      s_artist_rating: 'desc'
    };
    url.search = new URLSearchParams(params).toString();

    try {
      let favoriteTrack = await fetch(url);
      let trackData = await favoriteTrack.json();
      let track = new Track(trackData);

      let insertToDB = database('favorites').insert(
        { title: track.title,
          artistName: track.artistName,
          genre: track.genre,
          rating: track.rating
        }, ['id', 'title', 'artistName', 'genre', 'rating'])
        .then(track => response.status(200).json(track[0]));
    } catch(error) {
      console.log(error);
      response.status(200).json({error: 'There was an error.'});
    }

  } else if (request.body.title && !request.body.artistName) {
    response.status(400).json({error: 'Bad Request! Did you send an artist name?'});
  } else if (!request.body.title && request.body.artistName) {
    response.status(400).json({error: 'Bad Request! Did you send a song title?'});
  } else {
    response.status(400).json({error: 'Bad Request! Did you send an artist name and song title?'});
  }

});

module.exports = router;

