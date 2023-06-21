const mongoose = require('mongoose');
const dotenv=require('dotenv');

process.on('uncaughtException',err=>{
  console.log('Uncaught Exception ! Shutting down server...');
  console.log(err);
   process.exit(1);
});

dotenv.config({path: './config.env'});
const app=require('./app');


const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(con=>{
  console.log('Database connection Successfull!')
})


const port = 3000;
const server=app.listen(port, () => {
  console.log(`listening on port ${port}... `);
});

process.on('unhandledRejection',err=>{
  console.log('Unhandled rejection ! Shutting down server...');
  console.log(err.name, err.message);
  server.close(()=>{
    process.exit(1);
  })
});

process.on('uncaughtException',err=>{
  console.log('Uncaught Exception ! Shutting down server...');
  console.log(err.name, err.message);
  server.close(()=>{
   process.exit(1);
  })
});
