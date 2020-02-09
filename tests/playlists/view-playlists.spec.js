var shell = require('shelljs');
var request = require("supertest");
var app = require('../../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

describe('Test get all playlists endpoint', () => {
  beforeEach(async () => {
    await database.raw('truncate table playlists restart identity cascade');
  });

  afterEach(async () => {
    await database.raw('truncate table playlists restart identity cascade');
  });

  test('It should send back all of a users playlists', async () => {
    let playlists = await database('playlists').insert([
      { title: 'Road Trip!' },
      { title: 'Love Mix Tape #341' },
      { title: 'All of the Yogas' }
    ], ['id', 'created_at', 'updated_at']);

    const res = await request(app)
      .get('/api/v1/playlists');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3);

    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('createdAt');
    expect(res.body[0]).toHaveProperty('updatedAt');

    expect(res.body[0].id).toBe(playlists[0].id);
    expect(res.body[0].title).toBe('Road Trip!');
    expect(res.body[0].createdAt).toBe(playlists[0].created_at.toJSON());
    expect(res.body[0].updatedAt).toBe(playlists[0].updated_at.toJSON());

    expect(res.body[1].id).toBe(playlists[1].id);
    expect(res.body[1].title).toBe('Love Mix Tape #341');
    expect(res.body[1].createdAt).toBe(playlists[1].created_at.toJSON());
    expect(res.body[1].updatedAt).toBe(playlists[1].updated_at.toJSON());

    expect(res.body[2].id).toBe(playlists[2].id);
    expect(res.body[2].title).toBe('All of the Yogas');
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
