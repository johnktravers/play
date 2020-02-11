var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

const environment = process.env.NODE_ENV || 'test';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

describe('Favorites endpoints', () => {

  beforeEach(async () => {
    await database.raw('TRUNCATE TABLE favorites RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await database.raw('TRUNCATE TABLE favorites RESTART IDENTITY CASCADE');
  });

  describe('Add favorites endpoint', () => {
    test('It can add a new favorite track', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ title: "We Will Rock You", artistName: "Queen" })
        .type('form');

      expect(res.statusCode).toBe(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('artistName');
      expect(res.body).toHaveProperty('genre');
      expect(res.body).toHaveProperty('rating');

      expect(res.body.id).toEqual(1); // TEST THAT THE TABLE IS BEING TRUNCATED
      expect(res.body.title).toEqual('We Will Rock You');
      expect(res.body.artistName).toEqual('Queen');
      expect(res.body.genre).toEqual('Rock');
      expect(res.body.rating).toBeGreaterThanOrEqual(1);
      expect(res.body.rating).toBeLessThanOrEqual(100);
    });

    test('It shows an error if the track cannot be found', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ artistName: 'askjbgfafg', title: 'asfgkjaadk' })
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(400);
      expect(res.body.errorMessage).toEqual('No track found. Please check track title and artist name and try again.');
    });

    test('It cannot add a new favorite track if missing the artist name', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ title: "We Will Rock You" })
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(400);
      expect(res.body.errorMessage).toEqual('Bad Request! Did you send an artist name?');
    });

    test('It cannot add a new favorite track if missing the track title', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ artistName: "Queen" })
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(400);
      expect(res.body.errorMessage).toEqual('Bad Request! Did you send a song title?');
    });

    test('It cannot add a new favorite track if missing the track title and artist name', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({})
        .type('form');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toEqual(400);
      expect(res.body.errorMessage).toEqual('Bad Request! Did you send an artist name and song title?');
    });

    test('It adds the track if the genre is unknown', async () => {
      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ title: "We Will Rock You", artistName: "Queen, Anastacia, Amampondo Drummers" })
        .type('form');

      expect(res.statusCode).toBe(201);
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

    test('It cannot favorite the same track twice', async () => {
      await database('favorites').insert({
        title: 'Taylor',
        artistName: 'Jack Johnson',
        genre: 'Rock',
        rating: 26
      });

      const res = await request(app)
        .post("/api/v1/favorites")
        .send({ title: "Taylor", artistName: "Jack Johnson" })
        .type('form');

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('errorMessage');
      expect(res.body.status).toBe(409);
      expect(res.body.errorMessage).toBe('That track has already been added to your favorites!');
    });
  });

  describe('Delete favorites endpoint', () => {
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

  describe('GET favorites/:id endpoint', () => {
    test('It should respond to a GET request for a favorite/:id with that resource' , async () => {

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

  describe('GET favorites endpoint', () => {
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

      expect(res.body[0]).not.toHaveProperty('created_at');
      expect(res.body[0]).not.toHaveProperty('updated_at');

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

    test('It should send back an the empty array if there are no favorites', async () => {
      const res = await request(app)
        .get("/api/v1/favorites");

      expect(res.statusCode).toBe(200);

      expect(res.body).toEqual([]);
    });
  });
});
