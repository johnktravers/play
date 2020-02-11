
exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('playlistFavorites', function(table) {
      table.increments('id').primary();
      table.integer('playlist_id').unsigned();
      table.foreign('playlist_id').references('playlists.id');
      table.integer('favorite_id').unsigned();
      table.foreign('favorite_id').references('favorites.id');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('playlistFavorites')
  ]);
};
