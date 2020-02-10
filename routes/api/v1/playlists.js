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

router.get('/', async (request, response) => {
  let playlists = await database('playlists').select();

  if (playlists) {
    let playlistsArray = playlists.map(playlist => {
      return {
        id: playlist.id,
        title: playlist.title,
        createdAt: playlist.created_at,
        updatedAt: playlist.updated_at
      };
    })
    return response.status(200).json(playlistsArray);
  } else {
    let resp_obj = new ResponseObj(500, 'Unexpected error. Please try again.');
    return errorResponse(res_obj, response);
  }
});

router.put('/:id', async (request, response) => {
  let newTitle = request.body.title;

  if (newTitle) {
    let playlist = await database('playlists').where('id', request.params.id).first();
    if (playlist) {
      let updatedPlaylist = await database('playlists')
        .where('id', playlist.id)
        .update({title: newTitle}, ['id', 'title', 'created_at', 'updated_at']);

      if (updatedPlaylist[0]) {
        let updatedPlaylistFields = {
          id: updatedPlaylist[0].id,
          title: updatedPlaylist[0].title,
          createdAt: updatedPlaylist[0].created_at,
          updatedAt: updatedPlaylist[0].updated_at,
        }
        return response.status(200).json(updatedPlaylistFields);
      } else {
        let resp_obj = new ResponseObj(500, 'Unexpected error. Please try again.');
        return errorResponse(res_obj, response);
      }

    } else {
      let res_obj = new ResponseObj(404, 'No playlist with given ID was found. Please check the ID and try again.');
      return errorResponse(res_obj, response);
    }

  } else {
    let res_obj = new ResponseObj(400, 'Bad Request! Did you send a new playlist title?');
    return errorResponse(res_obj, response);
  }
});

router.delete('/:id', async (request, response) => {
  let rowsDeleted = await database('playlists').where('id', request.params.id).del();

  if (rowsDeleted === 1) {
    return response.status(204).send();
  } else {
    let res_obj = new ResponseObj(404, 'No playlist with given ID was found. Please check the ID and try again.');
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
