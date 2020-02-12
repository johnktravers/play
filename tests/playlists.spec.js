var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

describe('Playlists endpoints', () => {
  beforeEach(async () => {
    await database.raw('TRUNCATE TABLE playlists, favorites, "playlistFavorites" RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE playlists, favorites, "playlistFavorites" RESTART IDENTITY CASCADE');
  });

  describe('Add playlists endpoint', () => {
    test('It can add a new playlist', async () => {
      const res = await request(app)
        .post("/api/v1/playlists")
        .send({ title: "Music For Cooking Pasta" })
        .type('form');

      expect(res.statusCode).toBe(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');

      expect(res.body.id).toEqual(1); // TEST THAT THE TABLE IS BEING TRUNCATED
      expect(res.body.title).toEqual('Music For Cooking Pasta');
    });

    test('It cannot add a new playlist if missing the title', async () => {
      const res = await request(app)
        .post("/api/v1/playlists")
        .send({ title: "" })
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(400);
      expect(res.body.errorMessage).toEqual('Bad Request! Did you send a playlist title?');
    });

    test('It cannot add the same playlist twice', async () => {
      await database('playlists').insert({
        title: 'CodeSongs',
      });

      const res = await request(app)
        .post("/api/v1/playlists")
        .send({ title: "CodeSongs" })
        .type('form');

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toBe(409);
      expect(res.body.errorMessage).toBe('A playlist with that title has already been added to your playlists!');
    });
  });

  describe('Delete playlists endpoint', () => {
    test('It can delete a playlist by id', async () => {
      let playlist1 = {
        title: 'Shake It Off And Other Songs About Shake n Bake'
      };

      let playlist2 = {
        title: 'Cheesemonger Anthems'
      };

      let playlist_ids = await database('playlists').insert([playlist1, playlist2], 'id');

      const delete_res = await request(app)
        .delete(`/api/v1/playlists/${playlist_ids[0]}`);

      expect(delete_res.statusCode).toBe(204);

      let playlists = await database('playlists').select();

      expect(playlists.length).toBe(1);
      expect(playlists[0]).toHaveProperty('id');
      expect(playlists[0].id).toBe(playlist_ids[1]);
    });

    test('It sends a 404 message that no playlist was found if id is invalid', async () => {
      const res = await request(app)
        .delete('/api/v1/playlists/4');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(404);
      expect(res.body.errorMessage).toEqual('No playlist with given ID was found. Please check the ID and try again.');
    });

    test('It deletes the associated info from the joins table', async () => {
      let playlists = await database('playlists').insert(
        { title: 'Road Trip!' }, ['id', 'created_at', 'updated_at']);

      let favorites = await database('favorites').returning('*')
      .insert(
        {
          title: 'Banana Pancakes',
          artistName: 'Jack Johnson',
          genre: 'Rock',
          rating: 26
        });

      let playlistFavorites = await database('playlistFavorites').returning('*')
      .insert({ playlist_id: playlists[0].id, favorite_id: favorites[0].id });

      const res = await request(app)
        .delete(`/api/v1/playlists/${playlists[0].id}`);

      expect(res.statusCode).toBe(204);

      let playlistFavorite = await database('playlistFavorites')
      .where({ playlist_id: playlists[0].id, favorite_id: favorites[0].id });

      expect(playlistFavorite).toStrictEqual([]);
    });
  });

  describe('Update playlist endpoint', () => {
    test('It should update a playlist title by id', async () => {
      let playlists = await database('playlists').insert([
        { title: 'Lets go road trippin' },
        { title: 'Sunday Funday' }
      ], ['id', 'title', 'created_at', 'updated_at']);

      const res = await request(app)
        .put(`/api/v1/playlists/${playlists[0].id}`)
        .send({ title: 'On the road again' })
        .type('form');

      expect(res.statusCode).toBe(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');

      expect(res.body.id).toBe(playlists[0].id);
      expect(res.body.title).toBe('On the road again');
      expect(res.body.title).not.toBe('Lets go road trippin');
      expect(res.body.createdAt).toBe(playlists[0].created_at.toJSON());
      expect(res.body.updatedAt).toBe(playlists[0].updated_at.toJSON());
    });

    test('It shows an error if missing the new title', async () => {
      let playlists = await database('playlists').insert([
        { title: 'Lets go road trippin' },
        { title: 'Sunday Funday' }
      ], ['id', 'title', 'created_at', 'updated_at']);

      const res = await request(app)
        .put(`/api/v1/playlists/${playlists[0].id}`)
        .send({})
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toBe(400);
      expect(res.body.errorMessage).toBe('Bad Request! Did you send a new playlist title?');
    });

    test('It shows an error if playlist with given ID is not found', async () => {
      const res = await request(app)
        .put('/api/v1/playlists/4')
        .send({ title: 'Hooray for Mondays' })
        .type('form');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toBe(404);
      expect(res.body.errorMessage).toBe('No playlist with given ID was found. Please check the ID and try again.');
    });
  });

  describe('Get all playlists endpoint', () => {
    test('It should send back all of a users playlists', async () => {
      let playlists = await database('playlists').insert([
        { title: 'Road Trip!' },
        { title: 'Love Mix Tape #341' },
        { title: 'All of the Yogas' }
      ], ['id', 'created_at', 'updated_at']);

      let favorites = await database('favorites').returning('*').insert([
        {
          title: 'Banana Pancakes',
          artistName: 'Jack Johnson',
          genre: 'Rock',
          rating: 26
        },
        {
          title: 'Blank Space',
          artistName: 'Taylor Swift',
          genre: 'Pop',
          rating: 84
        }
      ]);

      let playlistFavorites = await database('playlistFavorites').returning('*').insert([
        {
          playlist_id: playlists[0].id,
          favorite_id: favorites[0].id
        },
        {
          playlist_id: playlists[0].id,
          favorite_id: favorites[1].id
        },
        {
          playlist_id: playlists[1].id,
          favorite_id: favorites[0].id
        },
      ]);

      const res = await request(app)
        .get('/api/v1/playlists');

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(3);

      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('songCount');
      expect(res.body[0]).toHaveProperty('songAvgRating');
      expect(res.body[0]).toHaveProperty('favorites');
      expect(res.body[0]).toHaveProperty('createdAt');
      expect(res.body[0]).toHaveProperty('updatedAt');

      expect(res.body[0].id).toBe(playlists[0].id);
      expect(res.body[0].title).toBe('Road Trip!');
      expect(res.body[0].songCount).toBe(2);
      expect(res.body[0].songAvgRating).toBe(55);
      expect(res.body[0].favorites[0]).toHaveProperty('id');
      expect(res.body[0].favorites[0]).toHaveProperty('title');
      expect(res.body[0].favorites[0]).toHaveProperty('artistName');
      expect(res.body[0].favorites[0]).toHaveProperty('genre');
      expect(res.body[0].favorites[0]).toHaveProperty('rating');
      expect(res.body[0].favorites.length).toBe(2);
      expect(res.body[0].createdAt).toBe(playlists[0].created_at.toJSON());
      expect(res.body[0].updatedAt).toBe(playlists[0].updated_at.toJSON());

      expect(res.body[1].id).toBe(playlists[1].id);
      expect(res.body[1].title).toBe('Love Mix Tape #341');
      expect(res.body[1].songCount).toBe(1);
      expect(res.body[1].songAvgRating).toBe(26);
      expect(res.body[1].favorites[0]).toHaveProperty('id');
      expect(res.body[1].favorites[0]).toHaveProperty('title');
      expect(res.body[1].favorites[0]).toHaveProperty('artistName');
      expect(res.body[1].favorites[0]).toHaveProperty('genre');
      expect(res.body[1].favorites[0]).toHaveProperty('rating');
      expect(res.body[1].favorites.length).toBe(1);
      expect(res.body[1].createdAt).toBe(playlists[1].created_at.toJSON());
      expect(res.body[1].updatedAt).toBe(playlists[1].updated_at.toJSON());

      expect(res.body[2].id).toBe(playlists[2].id);
      expect(res.body[2].title).toBe('All of the Yogas');
      expect(res.body[2].songCount).toBe(0);
      expect(res.body[2].songAvgRating).toBe(0);
      expect(res.body[2].favorites).toStrictEqual([]);
      expect(res.body[2].createdAt).toBe(playlists[2].created_at.toJSON());
      expect(res.body[2].updatedAt).toBe(playlists[2].updated_at.toJSON());
    });

    test('It should send back an empty array if there are no playlists', async () => {
      const res = await request(app)
        .get('/api/v1/playlists');

        expect(res.statusCode).toBe(200);
        expect(res.body).toStrictEqual([]);
    });
  });
});
