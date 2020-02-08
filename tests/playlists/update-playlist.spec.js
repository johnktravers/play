var shell = require('shelljs');
var request = require("supertest");
var app = require('../../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

describe('Test update playlist endpoint', () => {
  beforeEach(async () => {
    await database.raw('truncate table playlists restart identity cascade');
  });

  afterEach(async () => {
    await database.raw('truncate table playlists restart identity cascade');
  });

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
