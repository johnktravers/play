const dotenv = require('dotenv').config();
const express = require('express');
const router = express.Router();

const ResponseObj = require('../../../pojos/responseObj');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../../knexfile')[environment];
const database = require('knex')(configuration);

router.post('/', async (request, response) => {
  let playlistTitle = request.body.title;

  if (playlistTitle) {

    let playlist = { title: playlistTitle };
    let existsResObj = await alreadyFavorite(playlist);
    if (existsResObj.status === 409) { return errorResponse(existsResObj, response); }

    let savedPlaylistResObj = await addPlaylistToDB(playlist);
    if (savedPlaylistResObj.status === 201) {
      return response.status(201).json(savedPlaylistResObj.payload);
    } else {
      return errorResponse(savedPlaylistResObj, response);
    }
  } else {
    let res_obj = new ResponseObj(400, 'Bad Request! Did you send a playlist title?');
    return errorResponse(res_obj, response);
  }
});

async function alreadyFavorite(playlist) {
  let playlists = await database('playlists')
    .where({'title': playlist.title});
  if (playlists.length) {
    return new ResponseObj(409, 'A playlist with that title has already been added to your playlists!');
  } else {
    return new ResponseObj(200, 'Playlist has not yet been favorited.');
  }
};

async function addPlaylistToDB(playlist) {
  let savedPlaylist = await database('playlists').insert(
      {
        title: playlist.title,
      }, ['id', 'title', 'created_at', 'updated_at']);

  if (savedPlaylist[0]) {
    return new ResponseObj(201, savedPlaylist[0]);
  } else {
    return new ResponseObj(500, 'New playlist cannot be saved into database. Please try again.');
  }
};

function errorResponse(resObj, response) {
  return response.status(resObj.status).json({
    status: resObj.status,
    errorMessage: resObj.payload
  });
};

module.exports = router;
