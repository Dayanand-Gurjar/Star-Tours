const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell us your name']
    },
    email:{
        type:String,
        required:[true,'Please tell us your email address'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email address']
    },
    photo:{
        type:String,
    },
    role:{
        type:String,
        enum:['admin', 'user', 'guide', 'lead-guide'],
        default:'user'
    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        //this only works on CREATE and SAVE()
        validate:[
            function(el){
                return el==this.password
            },
            'Password are not same'
        ]
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
})

userSchema.pre('save',async function(next){
    //Only run this function if password is actually modified
    if(!this.isModified('password')) return next();
    //Hash the password
    this.password= await bcrypt.hash(this.password,12);
    //Delete the passwordconfirm field
    this.passwordConfirm=undefined;
    next();
})

userSchema.pre('save',async function(next){
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt=Date.now()-1000;
    next();
})

userSchema.pre(/^find/,function(next){
  //this points to the current query
  this.find({active:{$ne:false}});
  next();
})

userSchema.methods.correctPassword=async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordAfter=function(JWTTimeStamp){
    if(this.passwordChangedAt){
        const changedTimeStamp=parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimeStamp<changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken=function(){
    const resetToken=crypto.randomBytes(32).toString('hex');
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({resetToken},this.passwordResetToken)
    this.passwordResetExpires=Date.now()+10*60*1000;
    return resetToken;
}

const User=mongoose.model('User',userSchema);
  
module.exports = User;