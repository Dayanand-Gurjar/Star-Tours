const AppError = require("../utils/appError");

const handleCastErrorDB=(err)=>{
   const message = `Invalid ${err.path} : ${err.value}.`;
   return new AppError(message,400);
}

const handleDuplicateErrorDB=err=>{
    const value=err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message = `Duplicate field value ${value} : ${err.value}`;
    return new AppError(message,400);
}

const handleValidationErrorDB=err=>{
    const errors=Object.values(err.errors).map(el=>el.message);
    const message = `Invalid input data. ${errors.join(', ')}`;
    return new AppError(message,400);
}

const handleJWTError=()=> {return new AppError('Invalid token ! Please login again',401)};
const handleJWTExpiredError=()=>{
  return new AppError('Your token has expired! Please login again',401);
};

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrProd = (err, res) => {
  //Operational trusted error
  //1)Log error
  console.error('Error: ',err);
  //2)Generic message
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //Programming or other error
    console.error('Error: ',err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  
  if (process.env.NODE_ENV ==='development') {
    sendErrDev(err, res);

  } else if (process.env.NODE_ENV ==='production') {
    let error={...err};
    if(error.name==='CastError') error=handleCastErrorDB(error);
    if(error.code===11000) error=handleDuplicateErrorDB(error);
    if(error.name==='ValidationError') error=handleValidationErrorDB(error);
    if(error.name==='JsonWebTokenError') error=handleJWTError(error);
    if(error.name==='TokenExpiredError') error=handleJWTExpiredError(error);
    sendErrProd(err, res);
  }
};
