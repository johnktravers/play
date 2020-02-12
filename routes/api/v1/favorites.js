const dotenv = require('dotenv').config();
const express = require('express');
const router = express.Router();

const Track = require('../../../pojos/track');
const ResponseObj = require('../../../pojos/responseObj');
const musixmatchService = require('../../../services/musixmatchService');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../../knexfile')[environment];
const database = require('knex')(configuration);


router.post('/', async (request, response) => {
  let trackTitle = request.body.title;
  let artistName = request.body.artistName;

  if (trackTitle && artistName) {

    let trackDataResObj = await musixmatchService.getTrackData(trackTitle, artistName);
    if (trackDataResObj.status === 400) { return errorResponse(trackDataResObj, response); }

    let track = await new Track(trackDataResObj.payload);
    let existsResObj = await alreadyFavorite(track);
    if (existsResObj.status === 409) { return errorResponse(existsResObj, response); }

    let savedTrackResObj = await addFavoriteToDB(track);
    if (savedTrackResObj.status === 201) {
      return response.status(201).json(savedTrackResObj.payload);
    } else {
      return errorResponse(savedTrackResObj, response);
    }

  } else if (trackTitle && !artistName) {
    let res_obj = new ResponseObj(400, 'Bad Request! Did you send an artist name?');
    return errorResponse(res_obj, response);
  } else if (!trackTitle && artistName) {
    let res_obj = new ResponseObj(400, 'Bad Request! Did you send a song title?');
    return errorResponse(res_obj, response);
  } else {
    let res_obj = new ResponseObj(400, 'Bad Request! Did you send an artist name and song title?');
    return errorResponse(res_obj, response);
  }
});

router.get('/', async (request, response) => {
  let favorites = await database('favorites').select();
  if (favorites) {
    let favoriteArray = favorites.map((favorite) => {
      return { id: favorite.id, title: favorite.title, artistName: favorite.artistName, genre: favorite.genre, rating: favorite.rating };
    });
    return response.status(200).json(favoriteArray);
  } else {
    let resp_obj = new ResponseObj(500, 'Unexpected error. Please try again.');
    return errorResponse(res_obj, response);
  }
});

router.get('/:id', async (request, response) => {
  let favorite =  await database('favorites').where('id', request.params.id);

  if (favorite.length) {
    favoriteTrack = {
      id: favorite[0].id,
      title: favorite[0].title,
      artistName: favorite[0].artistName,
      genre: favorite[0].genre,
      rating: favorite[0].rating
    };
    return response.status(200).json(favoriteTrack);
  } else {
    let res_obj = new ResponseObj(404, 'No favorite track with given ID was found. Please check the ID and try again.');
    return errorResponse(res_obj, response);
  }
});

router.delete('/:id', async (request, response) => {
  await database('playlistFavorites').where('favorite_id', request.params.id).del();
  let rowsDeleted = await database('favorites').where('id', request.params.id).del();

  if (rowsDeleted === 1) {
    return response.status(204).send();
  } else {
    let res_obj = new ResponseObj(404, 'No favorite track with given ID was found. Please check the ID and try again.');
    return errorResponse(res_obj, response);
  }
});

async function alreadyFavorite(track) {
  let tracks = await database('favorites')
    .where({title: track.title, artistName: track.artistName});

  if (tracks.length) {
    return new ResponseObj(409, 'That track has already been added to your favorites!');
  } else {
    return new ResponseObj(200, 'Track has not yet been favorited.');
  }
};

async function addFavoriteToDB(track) {
  let savedTrack = await database('favorites').insert(
      {
        title: track.title,
        artistName: track.artistName,
        genre: track.genre,
        rating: track.rating
      }, ['id', 'title', 'artistName', 'genre', 'rating']);

  if (savedTrack[0]) {
    return new ResponseObj(201, savedTrack[0]);
  } else {
    return new ResponseObj(500, 'New track cannot be saved into database. Please try again.');
  }
};

function errorResponse(resObj, response) {
  return response.status(resObj.status).json({
    status: resObj.status,
    errorMessage: resObj.payload
  });
};

module.exports = router;
