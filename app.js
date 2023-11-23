//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose =require("mongoose");
require('dotenv').config();
const passport=require("passport");
const session=require("express-session");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

mongoose.set(`strictQuery`,false);
const connectDB=async()=> {
  try{
    const conn=await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connect : ${conn.connection.host}`);
  }catch(error){
    console.log(error);
    process.exit(1);
  }
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'hello there',
  resave: false,
  saveUninitialized: false
}));


// mongoose.connect('mongodb://127.0.0.1:27017/blogDB');

const homeStartingContent = "Step into a world of inspiration, insights, and imagination. Daily Journal is your canvas for expression, your sanctuary for ideas. Join us in celebrating the beauty of words and the stories they weave. Welcome aboard!";
const aboutContent = "At Daily Journal, we're passionate about words and the stories they tell. Our platform is a canvas for thought-provoking ideas, creative expressions, and meaningful discussions. Join us in exploring the boundless world of words and sharing in the art of storytelling. Welcome to our community!";
const contactContent = "Have a question, suggestion, or a story you want to share? We'd love to hear from you! At Daily Journal, we believe in the power of meaningful conversations and building connections. \n"+

"Feel free to reach out to us at contact@dailyjournal.com for any inquiries, feedback, or collaboration opportunities. We value your input and look forward to engaging with you. \n"+

"Join us in shaping the narrative, one interaction at a time.";




app.use(passport.initialize());
app.use(passport.session());


const postSchema=new mongoose.Schema({
  title: String,
  content:String,
  email : String,
  password : String,
  googleId: String,

});

var dd="";

postSchema.plugin(findOrCreate);
postSchema.plugin(passportLocalMongoose);

const Post=mongoose.model("Post",postSchema);

passport.use(Post.createStrategy());



passport.serializeUser(function(Post, cb) {
    process.nextTick(function() {
      cb(null, { id: Post.id, username: Post.username });
      dd=Post.id;
      // console.log(dd);
    });
  });
  
  passport.deserializeUser(function(Post, cb) {
    process.nextTick(function() {
      return cb(null,Post);
    });
  });




passport.use(new GoogleStrategy({
  clientID: process.env.Client_ID,
  clientSecret: process.env.Client_secret,
  callbackURL: "https://varma.cyclic.app/auth/google/home",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  Post.findOrCreate({ googleId: profile.id }, function (err, Post) {
    return cb(err, Post);
  });
}
));



// let posts = [];



app.get("/", function(req, res){
  
  res.render("openPage");
});

app.get("/home",function(req,res){
  Post.find().then(posts =>{
    res.render("home", {
      startingContent: homeStartingContent,
      post: posts
      });
  });

  
})

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  // const post = new Post({
  //   title: req.body.postTitle,
  //   content: req.body.postBody
  // });

  // post.save();

  // res.redirect("/home");


  const subTitle=req.body.postTitle;
  const subContent=req.body.postBody;

  // Post.findById(req.user.id,(err,foundPost)=>{
  //   if(err){
  //     console.log(err);
  //   }else if(foundPost){
  //     foundPost.title=subTitle;
  //     foundPost.content=subContent;

  //     foundPost.save(()=>{
  //       res.redirect("/home");
  //     })
      
  //   }

  // })

  // console.log(dd);

  Post.findById(dd)
  .then(foundPost=>{
    if(foundPost){
      foundPost.title=subTitle;
      foundPost.content=subContent;

      foundPost.save();
      res.redirect("/home");
      
    }
  })
  .catch(err =>{
    console.log(err);
  })





});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});



app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);

  Post.find().then(posts=>{
    posts.forEach(function(post){
      const storedTitle = _.lowerCase(post.title);
  
      if (storedTitle === requestedTitle) {
        Post.findOne({title:post.title}).then(posts =>{
          res.render("post", {
            title: posts.title,
          content: posts.content
            });
        });
  
      };
        
  
        });
  })
      
    });

app.get("/delete",function(req,res){
  Post.find().then(posts =>{
    res.render("delete", {
      post: posts
      });
  });
})


app.post("/delete",function(req,res){
  const deleteItem=req.body.checkbox;

  Post.findByIdAndRemove(deleteItem)
  .then(()=>console.log("deleted successfully"))
  .catch((err)=> console.log("deletion error: "+err));


  res.redirect("/home");
})




connectDB().then(()=>{
  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
  })
});



app.route('/auth/google')

  .get(passport.authenticate('google', {

    scope: ['profile']

  }));



app.get("/auth/google/home", 
  passport.authenticate('google', { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
  }); 


app.post("/register",function(req,res){
  Post.register({username:req.body.username},req.body.password,function(err,user){
      if(err){
          console.log(err);
          res.redirect("/register");
      }else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/home");
          });
      }
  });

  
});


app.post("/login",function(req,res){
  const ser=new Post({
      username:req.body.username,
      password:req.body.password

  });

  req.login(ser,function(err){
      if(err){
          console.log(err);
      }else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/home");
          }); 
      }
  })
  
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});




//checking it
// app.listen(process.env.PORT || 3000, function() {
//   console.log("Server started on port 3000");
// });
