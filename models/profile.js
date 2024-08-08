const mongoose=require("mongoose");

const ProfileSchema=new mongoose.Schema({

   
    bio:{
        type:String,
        
    },
   


    


})

const Profile=mongoose.model("Profile",ProfileSchema);
module.exports=Profile;