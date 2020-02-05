var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

describe('Test the favorites path', () => {
  beforeEach(async () => {
    await database.raw('truncate table favorites cascade');
  });

  afterEach(async () => {
    await database.raw('truncate table favorites cascade');
  });

  test('It should send back all of a users favorite tracks', async () => {

      let favorite1 = {
        title: "We Will Rock You",
        artistName: "Queen",
        genre: "Rock",
        rating: 87
      };

      let favorite2 = {
        title: "Shake It Off",
        artistName: "Taylor Swift",
        genre: "Pop",
        rating: 84
      };

      let favorite3 = {
       title: "Changes",
       artistName: "2Pac",
       genre: "Hip Hop/Rap",
       rating: 50
      };

      await database('favorites').insert(favorite1, 'id');
      await database('favorites').insert(favorite2, 'id');
      await database('favorites').insert(favorite3, 'id');

    const res = await request(app)
    .get("/api/v1/favorites");

    expect(res.statusCode).toBe(200);

    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('artistName');
    expect(res.body[0]).toHaveProperty('genre');
    expect(res.body[0]).toHaveProperty('rating');

    expect(res.body[0].title).toEqual('We Will Rock You');
    expect(res.body[0].artistName).toEqual('Queen');
    expect(res.body[0].genre).toEqual('Rock');
    expect(res.body[0].rating).toBeGreaterThanOrEqual(1);
    expect(res.body[0].rating).toBeLessThanOrEqual(100);

    expect(res.body[1].title).toEqual('Shake It Off');
    expect(res.body[1].artistName).toEqual('Taylor Swift');
    expect(res.body[1].genre).toEqual('Pop');
    expect(res.body[1].rating).toBeGreaterThanOrEqual(1);
    expect(res.body[1].rating).toBeLessThanOrEqual(100);

    expect(res.body[2].title).toEqual('Changes');
    expect(res.body[2].artistName).toEqual('2Pac');
    expect(res.body[2].genre).toEqual('Hip Hop/Rap');
    expect(res.body[2].rating).toBeGreaterThanOrEqual(1);
    expect(res.body[2].rating).toBeLessThanOrEqual(100);
  });

  test('It should send back a message saying there were no favorites found if there are no favorites', async () => {
    const res = await request(app)
      .get("/api/v1/favorites");

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual("No favorites found!");
  });
});
