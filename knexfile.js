
require('dotenv').load();
const conf =  {
  client: 'mysql',
  connection: {
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT
  },
  pool: {
    min: 2,
    max: 10
  }
};
module.exports = {
  development: conf,
  production: conf
};
