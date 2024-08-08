const mongoose=require("mongoose");

const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        // required:true
    },
    password:{
        type:String,
       
    },
    age:{
        type:Number,

    },
    name:{
        type:String,
    },
    bio:{
        type:String,
    },
    followers:[
        {
         type:String,
        }
    ],
    followings:[
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    created_at:{
        type:Date
    }


})

const User=mongoose.model("User",UserSchema);

module.exports=User;