const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const db = {};

// Define models
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Note = require('./note')(sequelize, DataTypes);
db.User = require('./user')(sequelize, DataTypes);

// Define relationships
db.User.hasMany(db.Note, { foreignKey: 'userId' });
db.Note.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;