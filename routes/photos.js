var express = require("express");
var router = express.Router();
var Photo = require("../models/photos");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dxn1mzdjf', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
//INDEX - show all photos  
router.get("/", function(req, res){
    
    // get all photos from DB
    Photo.find({}, function(err, allPhotos){
        if(err){
            console.log(err);
        } else {
            res.render("photos/index", {photos:allPhotos, currentUser: req.user});
        }
    });
});

//CREATE - add new photo to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the photo object under image property
      req.body.photo.image = result.secure_url;
      // add author to photo
      req.body.photo.author = {
        id: req.user._id,
        username: req.user.username
      }
      Photo.create(req.body.photo, function(err, photo) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/photos/' + photo.id);
      });
    });
});

//NEW - show form to create new photo
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("photos/new");
});

// SHOW - shows more info about one photo
router.get("/:id", function (req, res) {
    //find the photo with provided ID
    Photo.findById(req.params.id).populate("comments").exec(function (err, foundPhoto) {
        if (err) {
            console.log(err);
        } else {
 
            if (!foundPhoto) {
                return res.status(400).send("Item not found.")
            }
 
            res.render("photos/show", {photo: foundPhoto});
        }
    });
});
 
// EDIT PHOTO ROUTE
 
router.get("/:id/edit", middleware.checkPhotoOwnership, function (req, res) {
    // is user logged in
    Photo.findById(req.params.id, function (err, foundPhoto) {
 
        if (!foundPhoto) {
            return res.status(400).send("Item not found.")
        }
 
        res.render("photos/edit", {photo: foundPhoto});
    });
});

// UPDATE -- update photo route
router.put("/:id",  middleware.checkPhotoOwnership, function(req, res){
   // find and update the correct photo
   Photo.findByIdAndUpdate(req.params.id, req.body.photo, function(err, updatedPhoto){
       if(err){
           res.redirect("/photos");
       } else {
           res.redirect("/photos/" + req.params.id);
       }
   });
});

// DESTROY PHOTO ROUTE
router.delete("/:id", middleware.checkPhotoOwnership, function(req, res){
    Photo.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/photos");
        } else {
            res.redirect("/photos");
        }
    });
});

module.exports = router;
