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

  afterEach(() => {
    database.raw('truncate table favorites cascade');
  });

  test('It should respond to a GET request for a favorite :id with that favorite' , async () => {

    let favorite1 = {
     title: "Under Pressure",
     artistName: "David Bowie w/ Queen",
     genre: "Rock & Roll",
     rating: 36
    };

    let favorite2 = {
     title: "Can I Kick It?",
     artistName: "A Tribe Called Quest",
     genre: "Pop",
     rating: 33
    };

    let favorite1_id = await database('favorites').insert(favorite1, 'id');
    let favorite2_id =  await database('favorites').insert(favorite2, 'id');

    const res = await request(app)
      .get(`/api/v1/favorites/${favorite1_id}`);

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('artistName');
    expect(res.body).toHaveProperty('genre');
    expect(res.body).toHaveProperty('rating');

    expect(res.body).not.toHaveProperty('created_at');
    expect(res.body).not.toHaveProperty('updated_at');

    expect(res.body.title).toEqual('Under Pressure');
    expect(res.body.artistName).toEqual('David Bowie w/ Queen');
    expect(res.body.genre).toEqual('Rock & Roll');
    expect(res.body.rating).toBeGreaterThanOrEqual(1);
    expect(res.body.rating).toBeLessThanOrEqual(100);

    expect(res.body.title).not.toEqual('Can I Kick It?');
    expect(res.body.artistName).not.toEqual('A Tribe Called Quest');
    expect(res.body.genre).not.toEqual('Pop');
  });

  test('It should respond to a GET request for a favorite :id with a message if that favorite cant be found' , async () => {
    const res = await request(app)
      .get(`/api/v1/favorites/10000000`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(404);
      expect(res.body.errorMessage).toEqual('No favorite track with given ID was found. Please check the ID and try again.');
  });

});
