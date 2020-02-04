var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

describe('Add favorites endpoint', () => {
  beforeEach(async () => {
       await database.raw('truncate table favorites cascade');
    });

    afterEach(() => {
      database.raw('truncate table favorites cascade');
    });

  test('It can add a new favorite track', async () => {
    const res = await request(app)
      .post("/api/v1/favorites")
      .send({ title: "We Will Rock You", artistName: "Queen" })
      .type('form');

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('artistName');
    expect(res.body).toHaveProperty('genre');
    expect(res.body).toHaveProperty('rating');

    expect(res.body.title).toEqual('We Will Rock You');
    expect(res.body.artistName).toEqual('Queen');
    expect(res.body.genre).toEqual('Rock');
    expect(res.body.rating).toBeGreaterThanOrEqual(1);
    expect(res.body.rating).toBeLessThanOrEqual(100);
  });

  test('It cannot add a new favorite track if missing the artist name', async () => {
    const res = await request(app)

    .post("/api/v1/favorites")
    .send({ title: "We Will Rock You" })
    .type('form');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toEqual('Bad Request! Did you send an artist name?');
  });

  test('It cannot add a new favorite track if missing the track title', async () => {
    const res = await request(app)

    .post("/api/v1/favorites")
    .send({ artistName: "Queen" })
    .type('form');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toEqual('Bad Request! Did you send a song title?');
  });

  test('It cannot add a new favorite track if missing the track title and artist name', async () => {
    const res = await request(app)

    .post("/api/v1/favorites")
    .send({})
    .type('form');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toEqual('Bad Request! Did you send an artist name and song title?');
  });

  test('It adds the track if the genre is unknown', async () => {
    const res = await request(app)

    .post("/api/v1/favorites")
    .send({ title: "We Will Rock You", artistName: "Queen, Anastacia, Amampondo Drummers" })
    .type('form');

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('artistName');
    expect(res.body).toHaveProperty('genre');
    expect(res.body).toHaveProperty('rating');

    expect(res.body.title).toEqual('We Will Rock You');
    expect(res.body.artistName).toEqual('Queen, Anastacia, Amampondo Drummers');
    expect(res.body.genre).toEqual('Unknown');
    expect(res.body.rating).toBeGreaterThanOrEqual(1);
    expect(res.body.rating).toBeLessThanOrEqual(100);
  });
});
