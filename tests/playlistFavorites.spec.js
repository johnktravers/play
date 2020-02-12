var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

describe('Playlist favorites endpoints', () => {
  beforeEach(async () => {
    await database.raw('TRUNCATE TABLE playlists, favorites, "playlistFavorites" RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE playlists, favorites, "playlistFavorites" RESTART IDENTITY CASCADE');
  });

  describe('Add playlist favorite endpoint', () => {
    test('It can add a new playlist favorite', async () => {
      let playlist_id = await database('playlists').insert({title: 'Jogging Jams'}, 'id');
      let favorite_id = await database('favorites').insert({
        title: 'Shake It Off',
        artistName: 'T Swizzle',
        genre: 'Poptastic',
        rating: 1
      }, 'id');

      const res = await request(app)
        .post(`/api/v1/playlists/${playlist_id[0]}/favorites/${favorite_id[0]}`);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('Success');
      expect(res.body.Success).toEqual('Shake It Off has been added to Jogging Jams!');
    });

    test('It returns a 400 if favorite is already in playlist', async () => {
      let playlist_id = await database('playlists').insert({title: 'Jogging Jams'}, 'id');
      let favorite_id = await database('favorites').insert({
        title: 'Shake It Off',
        artistName: 'T Swizzle',
        genre: 'Poptastic',
        rating: 1
      }, 'id');

      await database('playlistFavorites')
        .insert({favorite_id: favorite_id[0], playlist_id: playlist_id[0]})

      const res = await request(app)
        .post(`/api/v1/playlists/${playlist_id[0]}/favorites/${favorite_id[0]}`);

      expect(res.statusCode).toBe(409)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('errorMessage')
      expect(res.body.status).toEqual(409)
      expect(res.body.errorMessage).toEqual('That favorite has already been added to that playlist!')
    });

    test('It returns a 404 if invalid favorite ID', async () => {
      let playlist_id = await database('playlists').insert({title: 'Jogging Jams'}, 'id');

      const res = await request(app)
        .post(`/api/v1/playlists/${playlist_id[0]}/favorites/4`);

      expect(res.statusCode).toBe(404)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('errorMessage')
      expect(res.body.status).toEqual(404)
      expect(res.body.errorMessage).toEqual('No favorite with given ID was found. Please check the ID and try again.')
    });

    test('It returns a 404 if invalid playlist ID', async () => {
      let favorite_id = await database('favorites').insert({
        title: 'Shake It Off',
        artistName: 'T Swizzle',
        genre: 'Poptastic',
        rating: 1
      }, 'id');

      const res = await request(app)
        .post(`/api/v1/playlists/5/favorites/${favorite_id[0]}`);

      expect(res.statusCode).toBe(404)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('errorMessage')
      expect(res.body.status).toEqual(404)
      expect(res.body.errorMessage).toEqual('No playlist with given ID was found. Please check the ID and try again.')
    });

    test('It returns a 404 if invalid playlist ID', async () => {
      const res = await request(app)
        .post(`/api/v1/playlists/5/favorites/6`);

      expect(res.statusCode).toBe(404)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('errorMessage')
      expect(res.body.status).toEqual(404)
      expect(res.body.errorMessage).toEqual('No playlist or favorite with given IDs were found. Please check the IDs and try again.')
    });
  });

  describe('Delete playlist favorites endpoint', () => {
    test('It can delete a favorite from a playlist by id', async () => {
      let playlistId1 = await database('playlists').insert({title: 'Jogging Jams'}, 'id');
      let playlistId2 = await database('playlists').insert({title: 'Hip Hop Hits'}, 'id');
      let favoriteId1 = await database('favorites').insert({
        title: 'Me!',
        artistName: 'Taylor Swift',
        genre: 'MegaPop',
        rating: 10
      }, 'id');
      let favoriteId2 = await database('favorites').insert({
        title: 'ABC',
        artistName: 'Jackson 5',
        genre: 'Pop',
        rating: 1
      }, 'id');


      let playlistFavoriteId1 = await database('playlistFavorites').insert({ playlist_id: playlistId1[0], favorite_id: favoriteId1[0] }, 'id');
      let playlistFavoriteId2 = await database('playlistFavorites').insert({ playlist_id: playlistId2[0], favorite_id: favoriteId2[0] }, 'id');

      const delete_res = await request(app)
        .delete(`/api/v1/playlists/${playlistId1[0]}/favorites/${favoriteId1[0]}`);

      expect(delete_res.statusCode).toBe(204);

      let playlistFavorites = await database('playlistFavorites').select();

      expect(playlistFavorites.length).toBe(1);
      expect(playlistFavorites[0]).toHaveProperty('id');
      expect(playlistFavorites[0].playlist_id).toBe(playlistId2[0]);
      expect(playlistFavorites[0].favorite_id).toBe(favoriteId2[0]);
    });

    test('It sends a 404 message that no playlist favorite was found if id is invalid', async () => {
      let playlistId1 = await database('playlists').insert({title: 'Jogging Jams'}, 'id');
      let favoriteId1 = await database('favorites').insert({
        title: 'Mean',
        artistName: 'Taylor Swift',
        genre: 'MegaPop',
        rating: 27
      }, 'id');

      const res = await request(app)
        .delete(`/api/v1/playlists/${playlistId1[0]}/favorites/${favoriteId1[0]}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(404);
      expect(res.body.errorMessage).toEqual('No playlist favorite was found. Please check the ID and try again.');
    });

    test('It sends a 404 message that no playlist was found if playlist id is invalid', async () => {
      const res = await request(app)
        .delete(`/api/v1/playlists/100/favorites/50`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(404);
      expect(res.body.errorMessage).toEqual('No playlist with given ID was found. Please check the ID and try again.');
    });

    test('It sends a 404 message that no favorite was found if favorite id is invalid', async () => {
      let playlistId1 = await database('playlists').insert({title: 'Jogging Jams'}, 'id');
      const res = await request(app)
        .delete(`/api/v1/playlists/${playlistId1[0]}/favorites/50`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(404);
      expect(res.body.errorMessage).toEqual('No favorite with given ID was found. Please check the ID and try again.');
    });
  });
});
