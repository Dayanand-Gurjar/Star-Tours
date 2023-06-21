const mongoose = require('mongoose');
const Tour=require('../../models/tourModel');
const fs = require('fs');
const dotenv=require('dotenv');

dotenv.config({path: './config.env'});

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(con=>{
  console.log('Database connection Successfull!')
})

const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`,'utf-8'));

//import data
const importData=async ()=>{
   try{
     await Tour.create(tours);
     console.log('Data Successfully loaded');
    }catch(err){
        console.log(err);
    }
    process.exit();
}

//Delete data
const deleteData=async ()=>{
    try{
       await Tour.deleteMany();
       console.log('Data deleted successfully');
    }catch(err){
        console.log(err);
    }
    process.exit();
}

if(process.argv[2]==='--import'){
    importData();
}else if(process.argv[2]==='--delete'){
    deleteData();
}
console.log(process.argv);