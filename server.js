require("dotenv").config();
const path = require("path");
const mongoose = require('mongoose');
const express = require("express");
const multer=require('multer');
const bodyparser=require('body-parser');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'postimages/'); // Ensure this directory exists and has proper permissions
    },
    filename: function (req, file, cb) {
        
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });


const app = express();
const bcrypt=require("bcrypt");
const methodoverride = require("method-override");
app.use(methodoverride("_method"));

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}
app.use('/postimages', express.static(path.join(__dirname, 'postimages')));




const jwt = require("jsonwebtoken");
const Post = require("./models/post.js");
const User=require("./models/user.js");
const Profile=require("./models/profile.js");
app.use(express.urlencoded({extended:true}));
const cookieparser=require("cookie-parser");
app.use(cookieparser());



app.set("view engine","ejs");

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());



app.get('/',(req,res)=>{
    res.render('index');
})


app.post('/create', async (req, res) => {
    try {
        const { username, email, password, age, name } = req.body;

        // Validate input fields (example: ensure username and password are provided)
        if (!username || !password) {
            return res.status(400).send("Username and password are required");
        }
        let newuser= await User.findOne({username:username});
        console.log(newuser)
        if(newuser){
            return res.status(400).send('username already  !')
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create the user in the database
        const createdUser = await User.create({
            username,
            email,
            password: hash,
            age,
            name,
        });

        // Generate JWT token
        const token = jwt.sign({ username: createdUser.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

        // Set token as a cookie
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'Strict' });

        // Redirect to login page
        res.redirect('/login');
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).send("Error creating user");
    }
});

app.get('/login/accounts',async (req,res)=>{
    let accounts= await User.find({});
  
  res.render('accounts',{accounts});
})
app.post('/follow/:username',authenticateToken,async (req,res)=>{
    let usertwo=req.body.username;
    let userone=req.user;
    let usertwodata=await User.findOne({username:usertwo})
    console.log(usertwodata)
    if(!usertwodata.followers.includes(userone.username)){
        await User.findOneAndUpdate({'username':usertwo},{$push:{followers:userone.username}});
        await User.findOneAndUpdate({'username':userone.username},{$push:{followings:usertwo}});
        res.status(200).json({message:'following succesfully'})
    }else{
        res.send("you have already followed this user")
    }
;    
   

})

app.get('/posts',authenticateToken  ,async (req, res) => {
    // res.json(posts.filter(post => post.username === req.user.name));
    let posts=await Post.find();
    let user=req.user;

 
 

  
    
    res.render('posts',{posts,user});
});

app.post('/posts',upload.single('postimg'),(req,res)=>{
    res.setHeader('Content-Type', 'multipart/form-data');
    let{msg,admin}=req.body;
    let file=req.file;
    console.log('uploaded file',file)
    if(msg){ let newpost=new Post({
        admin:admin,
        image:file ? file.filename : null,
       
        msg:msg,
        created_at:new Date()

    })
    newpost.save().then((res)=>{
        console.log("post was sent")})
    .catch((err)=>{
        console.log(err)
    })
     res.redirect('/posts');
    }
    else{
        res.send("post cant blank!,plz write your post")
    }
    
})

app.delete("/posts/:id",async (req,res)=>{
    let{id}=req.params
    let post= await Post.findByIdAndDelete(id);
    
   
    res.redirect('/posts')
})

app.get("/posts/:id/edit",async (req,res)=>{
    let {id}=req.params;
    let post=await Post.findById(id);

    res.render('editpost',{post});
})

app.post('/posts/:id/comments',(req,res)=>{
    console.log(req.params);
    console.log(req.body)
    res.redirect('/posts')
})

app.put("/posts/:id",async (req,res)=>{
    let{id,msg}=req.params;
    let{msg:newmsg}=req.body;


     let updatedchat = await Post.findByIdAndUpdate(id, { msg: newmsg }, { new: true, runValidators: true });
   
    res.redirect('/posts')
})


app.get('/login',(req,res)=>{
    res.render("login");
})

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ username });

        // If user not found, send an error response
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).send("Invalid username or password");
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // If password is valid, generate a token and set it as a cookie
        if (isPasswordValid) {
            const token = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            return res.render('profile', { user }); // Render profile page
        } else {
            // If password is invalid, send an error response
            return res.status(401).send("Invalid username or password");
        }
    } catch (error) {
        // Log the error and send an internal server error response
        console.error('Error during login:', error);
        return res.status(500).send("Internal server error");
    }
});


app.get('/logout',(req,res)=>{
        res.cookie("token","");
        res.redirect('/');
    })

    app.post('/posts/:id/like', async (req, res) => {
        try {
          
          const post = await Post.findById(req.params.id);
        //   const userid=req.params.id;

          if (!post) return res.status(404).send('Post not found');
        //   if (post.likedby.includes(userid)) {
        //     return res.status(400).send('You have already liked this post');
        //   }
          post.likes += 1;
        //   post.likedby.push(userid);
          await post.save();
          res.status(200).send(post);
        } catch (err) {
        //   res.status(500).send(err);
           console.log(err)        }
      });
      
      app.post('/posts/:id/dislike', async (req, res) => {
        try {
          const post = await Post.findById(req.params.id);
          if (!post) return res.status(404).send('Post not found');
      
          post.dislikes += 1;
          await post.save();
          res.status(200).send(post);
        } catch (err) {
          res.status(500).send(err);
        }
      });




app.get('/profile/:id',async(req,res)=>{
  
    let {id}=req.params;
    let user= await User.findById(id);
    let posts=await Post.find();
    if(!user){console.log("undefined user")}
   
   
    res.render('profile',{user});
    
})



//    

app.get('/profile/:id/edit',async(req,res)=>{
    let {id}=(req.params);


    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid user ID');
    }
    let user= await User.findById(id);
    return res.render('editprofile',{user})
});

app.put('/profile/:id',async(req,res)=>{
    let { id } = req.params;
    let user=User.findById(id)
    
  let { bio: newbio } = req.body;
  
  if (!isValidObjectId(id)) {
    return res.status(400).send('Invalid user ID');
}
 
  let updatedbio = await User.findByIdAndUpdate(id, {"$set":{ bio: newbio} }, { new: true, runValidators: true });
  
  
  res.redirect(`/profile/${id}`);
});

app.get('/profile/:id/addpost',async (req,res)=>{
    let {id}=(req.params);
    let user= await User.findById(id)
    // console.log("user is:",user)

    res.render('addpost',{user})
})








function authenticateToken(req, res, next) {
   
    const token=req.cookies.token;
    
    if (token == null) return res.send("error"); // Unauthorized

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}






app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

main().then(() => {
    console.log("Database connection successful");
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/chirpltApp');
}
