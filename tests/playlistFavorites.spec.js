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
});
