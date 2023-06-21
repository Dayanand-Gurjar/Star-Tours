const { promisify } = require("util");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken=(user,statusCode,res)=>{
  const token = signToken(user._id);
  const cookieOptions={
    expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
    httpOnly:true
  }
  if(process.env.NODE_ENV === 'production') cookieOptions.secure=true;
  res.cookie('jwt',token,cookieOptions);
  //delete the password from the output
  user.password=undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    },
  });
}
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser,201,res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }
  createSendToken(user,200,res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to access.", 401)
    );
  }

  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)If user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("User belonging to this token does no longer exist", 401)
    );
  }

  //4)Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }

  //Grant access to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  //2)Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3)Send it to user's email address
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message=`Forgot your password and submit your PATCH request with your new password and passwordConfirm to : ${resetURL}.\nIf you didn.t forget your password Please ignore this mail.`;


  try{
    await sendEmail({
        email:user.email,
        subject:'Your password reset token (valid for 10 min)',
        message
      })
    
      res.status(200).json({
        status:'success',
        message:'Token sent to email'
      })
  }catch(err){
    user.passwordResetToken =undefined;
    user.passwordResetExpires=undefined;
    await user.save({validateBeforeSave:false});

    return next(new AppError('There was an error sending the email.Try again later',500));
  }
  
});

exports.resetPassword = catchAsync(async(req, res, next) => {
  //1)Get user based on token
  const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user=await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});

  //2)If token has not expired and there is user set the password
  if(!user){
    return next(new AppError('Token is invalid or has expired.',400));
  }
  user.password=req.body.password;
  user.passwordConfirm=req.body.passwordConfirm;
  user.passwordResetToken=undefined;
  user.passwordResetExpires=undefined;
  await user.save();
  //3)Update changedPasswordAt property for user

  //4)Log the user in sent the JWT
  createSendToken(user,200,res);
});

exports.updatePassword=catchAsync(async(req, res,next) => {
  //1)Get user from collection
  const user=await User.findById(req.user.id).select('+password');
  //2)Check if posted current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
    return next(new AppError('Your password is incorrect.',401));
  }
  //3)If so update password
  user.password=req.body.password;
  user.passwordConfirm=req.body.passwordConfirm;
  await user.save();
  //User.findByIdAndUpdate() will not work as intended
  //4)Log in user and send JWT
  createSendToken(user,200,res);
});
