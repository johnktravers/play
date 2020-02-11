
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('playlistFavorites', function(table) {
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('playlistFavorites', function(table) {
      table.dropTimestamps('created_at');
      table.dropTimestamps('updated_at');
    })
  ]);
};
