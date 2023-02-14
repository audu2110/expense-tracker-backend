const Sequelize = require('sequelize');

const sequelize = new Sequelize('expensetry', 'root', 'AUDUMBAR', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;