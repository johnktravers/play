const dotenv = require('dotenv').config();
const express = require('express');
const router = express.Router();

const Track = require('../../../pojos/track');
const musixmatchService = require('../../../services/musixmatch-service');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../../knexfile')[environment];
const database = require('knex')(configuration);


router.post('/', async (request, response) => {
  let trackTitle = request.body.title;
  let artistName = request.body.artistName;

  if (trackTitle && artistName) {

    try {
      let trackData = await musixmatchService.getTrackData(trackTitle, artistName, response);
      let track = new Track(trackData);
      let exists = await alreadyFavorite(track, response)
      if (exists) { return errorResponse(409, exists, response) }
      await addFavoriteToDB(track, response);
    } catch(error) {
      return errorResponse(500, 'Something went wrong. Please try again.', response)
    }

  } else if (trackTitle && !artistName) {
    return errorResponse(400, 'Bad Request! Did you send an artist name?', response)
  } else if (!trackTitle && artistName) {
    return errorResponse(400, 'Bad Request! Did you send a song title?', response)
  } else {
    return errorResponse(400, 'Bad Request! Did you send an artist name and song title?', response)
  }

});

router.get('/', async (request, response) => {
  return await database('favorites')
      .then((favorites) => {
        if (favorites.length) {
          return response.status(200).json(favorites);
        } else {
          return response.status(200).json({ message: 'No favorites found!' });
        }
      }).catch(error => response.status(404).json({error: "There was an error!"}));
});


async function alreadyFavorite(track, response) {
  return await database('favorites')
    .where({title: track.title, artistName: track.artistName})
    .then(result => {
      if (result.length) {
        return 'That track has already been added to your favorites!'
      }
    })
};

async function addFavoriteToDB(track, response) {
  return await database('favorites')
    .insert(
      {
        title: track.title,
        artistName: track.artistName,
        genre: track.genre,
        rating: track.rating
      }, ['id', 'title', 'artistName', 'genre', 'rating']
    )
    .then(track => response.status(201).json(track[0]))
    .catch(error => errorResponse(500, error, response))
};

function errorResponse(status, message, response) {
  return response.status(status).json({
    status: status,
    errorMessage: message
  });
};

module.exports = router;
