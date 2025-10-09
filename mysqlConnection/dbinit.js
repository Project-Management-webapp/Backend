const {sequelize} = require('./dbConnection');

const initDB = (callback) => {
  sequelize.authenticate()
    .then(() => {
      console.log(' Database connected');
      require('../model/associationModel/association');
      return sequelize.sync(); // Creates tables if not exist {alter:true}
    })
    .then(() => {
      console.log(' All models synced');
      callback(); 
    })
    .catch((error) => {
      console.error(' Error connecting to the database:', error);
      process.exit(1); 
    });
};

module.exports = initDB;
