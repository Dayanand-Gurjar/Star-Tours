const User=require('../models/userModel');
const APIFeatures=require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync=require('../utils/catchAsync');

const filterObj=(obj, ...allowedFields)=>{
  const newObj={};
  Object.keys(obj).forEach(key=>{
    if(allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
}
exports.getAllUsers=catchAsync(async (req,res,next)=>{
    const users = await User.find();

    res.status(200).json({
      status: "success",
      result: users.length,
      data: {
        users,
      },
    });
});

exports.updateMe=catchAsync(async (req,res,next)=>{

  //1)Create error if user update the password
  if(req.body.password ||req.body.passwordConfirm){
    return next(new AppError('This route is not for update password. Please use /updateMyPassword for the same',400));
  }
  //2)Filter out unwanted fields which are not allowed to be updated
  const filterBody=filterObj(req.body,'name','email');
  
  //3)Update user document
  const updatedUser=await User.findByIdAndUpdate(req.user.id,filterBody,{
    new:true,
    runValidators:true
  });

  res.status(200).json({
    status: "success",
    data:{
      user: updatedUser
    }
  });
})

exports.deleteMe=catchAsync(async(req, res, next)=>{
  await User.findByIdAndUpdate(req.user.id,{active:false});

  res.status(204).json({
    status:"success",
    data:null
  });
})

exports.createUser=(req,res)=>{
    res.status(500).json({
        status:"error",
        message:'this route has not yet defined'
    });
}