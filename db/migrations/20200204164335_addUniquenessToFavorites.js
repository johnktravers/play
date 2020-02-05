
exports.up = function(knex) {
  return Promise.all([
    knex.schema.table('favorites', function(table) {
      table.unique(['title', 'artistName']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('favorites', function(table) {
      table.dropUnique(['title', 'artistName'])
    })
  ]);
};
