var shell = require('shelljs');
var request = require('supertest');
var app = require('../../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

describe('Delete favorites endpoint', () => {
  beforeEach(async () => {
       await database.raw('TRUNCATE TABLE favorites RESTART IDENTITY CASCADE');
    });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE favorites RESTART IDENTITY CASCADE');
  });

  test('It can delete a favorite track by id', async () => {
    let favorite1 = {
      title: 'Taylor',
      artistName: 'Jack Johnson',
      genre: 'Rock',
      rating: 26
    };

    let favorite2 = {
      title: 'Shake It Off',
      artistName: 'Taylor Swift',
      genre: 'Pop',
      rating: 84
    };

    let favorite_ids = await database('favorites').insert([favorite1, favorite2], 'id')

    const delete_res = await request(app)
      .delete(`/api/v1/favorites/${favorite_ids[0]}`);

    expect(delete_res.statusCode).toBe(204)

    const list_res = await request(app)
      .get("/api/v1/favorites");

    expect(list_res.statusCode).toBe(200);
    expect(list_res.body.length).toBe(1);

    expect(list_res.body[0]).toHaveProperty('id');
    expect(list_res.body[0].id).toBe(favorite_ids[1]);
  });

  test('It sends a 404 message that no track was found if id is invalid', async () => {
    const res = await request(app)
      .delete('/api/v1/favorites/4');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('errorMessage');
    expect(res.body.status).toEqual(404);
    expect(res.body.errorMessage).toEqual('No favorite track with given ID was found. Please check the ID and try again.');
  });
});
