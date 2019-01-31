var express = require("express");
var router = express.Router({mergeParams: true});
var Photo = require("../models/photos");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// =========================
// COMMENT ROUTES
// =========================

//Comments new
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find photo by id
    Photo.findById(req.params.id, function(err, photo){
        if(err){
            console.log(err);
        } else {
                res.render("comments/new", {photo: photo});
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
    //lookup photo using ID
    Photo.findById(req.params.id, function(err, photo){
        if(err){
            console.log(err);
            res.redirect("/photos");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    //add username and id to 
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    photo.comments.push(comment);
                    photo.save();
                    console.log(comment);
                    req.flash("success", "Successfully added comment");
                    res.redirect("/photos/" + photo._id);
                }
            })
        }
    });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {photo_id: req.params.id, comment: foundComment});
        }
    });
});

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/photos/" + req.params.id);
        }
    });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndRemove(req.params.comment_id, function(err){
      if(err){
          res.redirect("back");
      } else {
        req.flash("success", "Comment deleted");
          res.redirect("/photos/" + req.params.id);
      }
   });
});

module.exports = router;

