
exports.up = function(knex, Promise) {
  return knex.schema.createTable('events', (t) => {
    t.increments();
    t.string('name');
    t.datetime('time');
    t.timestamps();
  });
};

exports.down = function(knex, Promise) {

};
