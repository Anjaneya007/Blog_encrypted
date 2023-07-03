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

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";




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





// app.listen(process.env.PORT || 3000, function() {
//   console.log("Server started on port 3000");
// });
