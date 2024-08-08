require("dotenv").config();

const express=require("express");
const app=express();


const jwt=require("jsonwebtoken");
app.use(express.json());
let refreshTokens=[];

let posts=[
    {
        username:"amol",
        tittle:"post 1",
    },
    {
        username:"amolk",
        tittle:"post 2",
    }
]
app.post('/token',(req,res)=>{
    const refreshToken=req.body.token;
    if(refreshToken==null){res.sendStatus(401)};
    if(!refreshTokens.includes(refreshToken)){
        res.sendStatus(403);
    }
    

})

app.post('/login',(req,res)=>{
    //authenticate user here


    const username=req.body.username;
    const user={name:username};

    const accessToken=generateAccessToken(user);
    const refreshToken=jwt.sign(user,process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken)

    res.json({accessToken:accessToken,refreshToken:refreshToken});



})

function generateAccessToken(user){
    return jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"})
}
app.listen(3000);