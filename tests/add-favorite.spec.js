var shell = require('shelljs');
var request = require("supertest");
var app = require('../app');

describe('Add favorites endpoint', () => {
  test('It can add a new favorite song', async () => {
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
});
