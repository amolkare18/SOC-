const mongoose=require("mongoose");


const PostSchema=new mongoose.Schema({
    admin:{
        type:String,
        required:true
    },
    
    to:{
        type:String,
        
    },

    image:{
        type:String,
    },
    msg:{
        type:String,
        maxLength:250
    },
    created_at:{
        type:Date,
        required:true
    },
    likes:{
        type:Number,
        default:0
    },
    dislikes:{
        type:Number,
        default:0
    },
    likedby:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    dislikedby:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    
    ],
    comments:[
        {
        text:String,
        postedby: {type:mongoose.Schema.Types.ObjectId,ref: 'User' }
        }
    ]









    

})
const Post=mongoose.model("Post",PostSchema);

module.exports=Post;