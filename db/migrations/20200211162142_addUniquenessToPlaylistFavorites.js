
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('playlistFavorites', function(table) {
      table.unique(['favorite_id', 'playlist_id']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('playlistFavorites', function(table) {
      table.dropUnique(['favorite_id', 'playlist_id']);
    })
  ]);
};
