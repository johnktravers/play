var shell = require('shelljs');
var request = require('supertest');
var app = require('../../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

describe('Delete playlists endpoint', () => {
  beforeEach(async () => {
       await database.raw('TRUNCATE TABLE playlists RESTART IDENTITY CASCADE');
    });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE playlists RESTART IDENTITY CASCADE');
  });

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
});
