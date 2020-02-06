var shell = require('shelljs');
var request = require("supertest");
var app = require('../../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

describe('Add playlists endpoint', () => {
  beforeEach(async () => {
    await database.raw('TRUNCATE TABLE playlists RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE playlists RESTART IDENTITY CASCADE');
  });

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
    })

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
