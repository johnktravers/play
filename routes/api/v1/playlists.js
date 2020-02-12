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
  let playlists = await database('playlists').select().orderBy('id', 'asc');

  if (playlists) {
    let favorites = await getFavorites(playlists);

    let playlistsArray =  playlists.map((playlist, index) => {
      return {
        id: playlist.id,
        title: playlist.title,
        songCount: favorites[index].length,
        songAvgRating: songAvgRating(favorites[index]),
        favorites: favorites[index],
        createdAt: playlist.created_at,
        updatedAt: playlist.updated_at
      };
    });

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

router.post('/:playlistID/favorites/:favoriteID', async (request, response) => {
  let playlist = await database('playlists').where('id', request.params.playlistID).first();
  let favorite = await database('favorites').where('id', request.params.favoriteID).first();

  if (playlist && favorite) {
    let existsResObj = await alreadyPlaylistFavorite(playlist, favorite);
    if (existsResObj.status == 409) { return errorResponse(existsResObj, response); }

    let savedPlaylistFavoriteResObj = await addPlaylistFavoriteToDB(playlist, favorite);
    if (savedPlaylistFavoriteResObj.status == 201) {
      return response.status(201).json({
        Success: savedPlaylistFavoriteResObj.payload
      });
    } else {
      return errorResponse(savedPlaylistFavoriteResObj, response);
    }

  } else if (playlist && !favorite) {
    let res_obj = new ResponseObj(404, 'No favorite with given ID was found. Please check the ID and try again.')
    return errorResponse(res_obj, response);
  } else if (!playlist && favorite) {
    let res_obj = new ResponseObj(404, 'No playlist with given ID was found. Please check the ID and try again.')
    return errorResponse(res_obj, response);
  } else {
    let res_obj = new ResponseObj(404, 'No playlist or favorite with given IDs were found. Please check the IDs and try again.')
    return errorResponse(res_obj, response);
  }
});

router.delete('/:playlistID/favorites/:favoriteID', async (request, response) => {
  let playlist = await database('playlists').where('id', request.params.playlistID).select();
  if (playlist.length) {
    let favorite = await database('favorites').where('id', request.params.favoriteID).select();
    if (favorite.length) {
      let rowsDeleted = await database('playlistFavorites').where({playlist_id: request.params.playlistID, favorite_id: request.params.favoriteID}).del();
      if (rowsDeleted === 1) {
        return response.status(204).send();
      } else {
        let res_obj = new ResponseObj(404, 'No playlist favorite was found. Please check the ID and try again.');
        return errorResponse(res_obj, response);
      }
    } else {
      let res_obj = new ResponseObj(404, 'No favorite with given ID was found. Please check the ID and try again.');
      return errorResponse(res_obj, response);
    }
  } else {
    let res_obj = new ResponseObj(404, 'No playlist with given ID was found. Please check the ID and try again.');
    return errorResponse(res_obj, response);
  }
});

router.get('/:playlistID/favorites', async (request, response) => {
  let playlists = await database('playlists')
    .where('id', request.params.playlistID);

  if (playlists) {
    let favorites = await getFavorites(playlists);

    let playlistsArray =  playlists.map((playlist, index) => {
      return {
        id: playlist.id,
        title: playlist.title,
        songCount: favorites[index].length,
        songAvgRating: songAvgRating(favorites[index]),
        favorites: favorites[index],
        createdAt: playlist.created_at,
        updatedAt: playlist.updated_at
      };
    });

    return response.status(200).json(playlistsArray[0]);
  } else {
    let resp_obj = new ResponseObj(500, 'Unexpected error. Please try again.');
    return errorResponse(res_obj, response);
  }
});





async function alreadyPlaylistFavorite(playlist, favorite) {
  let playlistFavorite = await database('playlistFavorites')
    .where({playlist_id: playlist.id, favorite_id: favorite.id});
  if (playlistFavorite.length) {
    return new ResponseObj(409, 'That favorite has already been added to that playlist!');
  } else {
    return new ResponseObj(200, 'Favorite has not yet been added to that playlist.');
  }
};

async function addPlaylistFavoriteToDB(playlist, favorite) {
  let savedPlaylistFavorite = await database('playlistFavorites').insert({
    playlist_id: playlist.id,
    favorite_id: favorite.id
  }, 'id');
  if (savedPlaylistFavorite[0]) {
    return new ResponseObj(201, `${favorite.title} has been added to ${playlist.title}!`);
  } else {
    return new ResponseObj(500, 'Favorite cannot be added to playlist. Please try again.');
  }
};

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

async function getFavorites(playlists) {
  return Promise.all(
    playlists.map(async (playlist) => {
    return await database('favorites')
      .join('playlistFavorites', 'playlistFavorites.favorite_id', 'favorites.id')
      .where('playlistFavorites.playlist_id', playlist.id)
      .select('favorites.id', 'favorites.title', 'favorites.artistName', 'favorites.genre', 'favorites.rating');
    })
  );
};

function songAvgRating(favorites) {
  let count = favorites.length;
  if (count === 0) { return 0 }

  let sum = 0;
  favorites.forEach(favorite => sum += favorite.rating)

  return sum / count;
};


function errorResponse(resObj, response) {
  return response.status(resObj.status).json({
    status: resObj.status,
    errorMessage: resObj.payload
  });
};

module.exports = router;
