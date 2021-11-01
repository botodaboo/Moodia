const Post = require('./models/post')
const User = require('./models/user')
const Department = require('./models/department')
const Article = require('./models/article')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
})

const upload = multer({storage: storage})

module.exports = function (app, passport) {
//-----------------------------SIGNUP - LOGIN - LOGOUT---------------------------------------//
    //----------------------------Admin Sign up--------------------------------------------//
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/login',
        failureRedirect: '/login', 
        failureFlash: true 
    }));

    app.get('/signup', function (req, res) {
        res.render('signup', { title: 'Signup to Mooda', layout:'blank' }); 
    });
    //----------------------------Login--------------------------------------------//
    //Login via Google
    app.get('/auth/google',
    passport.authenticate('google', { scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ] }));
    
    app.get('/auth/google/callback',
        passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));

    //Login page
    app.get('/login', function (req, res) {
        res.render('login', { title: 'Login to Mooda', layout:'blank', message: req.flash('loginMessage')}); 
    });
    
    app.post('/login', passport.authenticate("local-login", {
        successRedirect : '/',
        failureRedirect : '/login',
        failureFlash : true
    }));
    
    app.get('/', isLoggedIn, async (req, res) => {
        user = req.user;
        if (user.role === 'admin') res.redirect('/admin');
        if (user.role === 'department') res.redirect('/department');
        if (user.role === 'student') res.redirect('/home');
    })

    //Log out
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });

    //----------------------------Direct to Home--------------------------------------------//
    //Admin
    app.get('/admin', isLoggedIn, async (req, res) => {
        let dptl = await Department.find({'name':{$regex : "Khoa.*"}});
        let dptr = await Department.find({'name':{$not : /.*Khoa..*/}});
        let dpt = await Department.find();
        let dptacc = await User.find({'role':'department'});
        let articles = await Article.find();
        let posts = await Post.find();
        posts = posts.reverse();
        user = req.user;
        res.render('homeadmin', { 
            title: 'Mooda', 
            user,
            dpt,
            dptacc,
            dptl,
            dptr,
            posts,
            articles
        });
    })

    //Department
    app.get('/department', isLoggedIn, async (req, res) => {
        user = req.user;
        let posts = await Post.find();
        posts = posts.reverse();
        let articles = await Article.find();
        let dpt = await Department.find();
        res.render('homedpt', {
            user,
            posts,
            articles,
            dpt,
        })
    })

    //Student
    app.get('/home', isLoggedIn, async(req, res) => {
        user = req.user;
        let posts = await Post.find().sort({_id:-1}).limit(10);
        let articles = await Article.find();
        res.render('home', { 
            title: 'Mooda', 
            user,
            posts,
            articles,
        });
    });

    //autoload10feeds
    app.post('/get10feed', isLoggedIn, async(req, res) => {
        user = req.user;
        var skip = parseInt(req.body.skip);
        var profileID = req.body.profileID;
        console.log(skip)
        if(profileID === "") {
            var posts = await Post.find().sort({_id:-1}).skip(skip).limit(10);
        }
        else {
            var posts = await Post.find({userID: profileID}).sort({_id:-1}).skip(skip).limit(10);
        }
        let articles = await Article.find();
        res.json({posts: posts, articles: articles});
    });
//------------------------------FUNCTION---------------------------------------//
    //----------------------------ADMIN--------------------------------------------//
    //Create Department Account
    app.post('/adddpt', isLoggedIn, async (req, res) => {
        var username = req.body.username;
        var password = req.body.password;
        var dptname = req.body.dptname;
        new User({
            'highuser.username': username,
            'highuser.password': password,
            'highuser.name': dptname,
            'role': 'department',
        }).save();
        res.redirect('/admin');
    })

    //Add Department Permission
    app.post('/addpms', isLoggedIn, async (req, res) => {
        var dptname = req.body.editdpt;
        var pmsid = req.body.dptid;
        let pms =  await Department.find({_id: pmsid})

        await User.findOneAndUpdate({'highuser.name': dptname}, {
            $push: {
                permission: {
                    dptid: pmsid,
                    dptname: pms[0].name,
                }
            }
        })
        res.redirect('/admin')
    })
    //----------------------------DEPARTMENT--------------------------------------------//
    //Change Password
    app.post('/editpwd/:id', isLoggedIn, async (req, res) => {
        dptID = req.params.id;
        const newpassword = req.body.password;
        await User.findByIdAndUpdate(dptID, {
            'highuser.password': newpassword,
        });
        res.redirect('/department');
    });

    //Department List
    app.get('/dptlist', isLoggedIn, async(req, res) => {
        let dpt = await Department.find();
        user = req.user
        res.render('dptlist', { 
            title: 'Mooda || Department List',
            dpt, user
        });
    });

    //Create Article
    app.post('/addarticle', isLoggedIn, async (req, res) => {
        var notititle = req.body.notititle;
        var noticontent = req.body.noticontent;
        var notito = req.body.notito;
        new Article({
            'title': notititle,
            'content': noticontent,
            'dptId': notito,
        }).save();
        res.redirect('/department')
    })

    //Article Details
    app.get('/article/:id', isLoggedIn, async (req, res) => {
        var artid = req.params.id;
        user = req.user;
        let articles = await Article.find()
        let article = await Article.find({_id: artid})
        res.render('article', {article, articles, user})
    })

    //Article List
    app.get('/articlelist', isLoggedIn, async (req, res) => {
        user = req.user;
        let articles = await Article.find();
        articles = articles.reverse();
        res.render('articlelist', {
            articles,
            user
        })
    })

    //Article List by Department
    app.get('/department/:id', isLoggedIn, async (req, res) => {
        var artid = req.params.id;
        let articles = await Article.find({'dptId': artid});
        articles = articles.reverse();
        user = req.user;
        res.render('articlelist', {
            articles, 
            user
        })
    })
    //----------------------------STUDENT--------------------------------------------//
    //--------------POST------------//
    //Create Post
    app.post('/post', upload.single('postImage'), isLoggedIn, function(req, res) {
        var user = req.user;
        var content = req.body.content;
        var video = req.body.video;
        if (user.role === "student") {
            if(!req.file) {
                var newPost = new Post({
                    'userID': user._id,
                    'userName': user.student.name,
                    'postContent': content,
                    'image': '#',
                    'video': video
                })
            }
            else {
                var newPost = new Post({
                    'userID': user._id,
                    'userName': user.student.name,
                    'postContent': content,
                    'image': req.file.filename,
                    'video': video
                })
            }
        }
        else {
            if(!req.file) {
                var newPost = new Post({
                    'userID': user._id,
                    'userName': user.highuser.name,
                    'postContent': content,
                    'image': '#',
                    'video': video
                })
            }
            else {
                var newPost = new Post({
                    'userID': user._id,
                    'userName': user.highuser.name,
                    'postContent': content,
                    'image': req.file.filename,
                    'video': video
                })
            }
        }
        newPost.save(function() {
            res.json({newPost: newPost, user: req.user});
        })
    })
    //Edit Post
    app.post('/editpost', isLoggedIn, async (req, res) => {
        var content = req.body.newcontent;
        var postID = req.body.postID
        var editedPost = await Post.findByIdAndUpdate(postID, {
            'postContent': content,
        })
        res.json({user: req.user, editedPost: editedPost, postID: postID, newcontent: content});
    })
    //Delete Post
    app.post('/delete', isLoggedIn, async(req, res) => {
        const postID = req.body.postID;
        await Post.deleteOne({_id: postID});
        res.json({postID: postID});
    })

    //Comment
    app.post('/comment', isLoggedIn, async(req, res) => {
        user = req.user;
        const postID = req.body.postID;
        const content = req.body.cmtcontent;
        if(user.role === "admin" || user.role === "department") {
            await Post.findByIdAndUpdate(postID, {
                $push: {
                    comment: {
                        userName: user.highuser.name,
                        cmtContent: content,
                        userID: user._id,
                    }
                }
            })
        }

        if (user.role === "student") {
            await Post.findByIdAndUpdate(postID, {
                $push: {
                    comment: {
                        userName: user.student.name,
                        cmtContent: content,
                        userID: user._id,
                    }
                }
            })
        }
        
        res.json({user: req.user, content: content, postID: postID});
    })

    //Delete Comment
    app.post('/deletecomment', isLoggedIn, async(req, res) => {
        const commentID = req.body.commentID;
        const postID = req.body.postID;
        await Post.findOneAndUpdate({_id: postID}, {
            $pull: {
                comment: {
                    _id: commentID
                }
            }
        })
        res.json({commentID: commentID});
    })
    //--------------Profile------------//
    //See Profile
    app.get('/profile/:id', isLoggedIn, async (req, res) => {
        userID = req.params.id;
        let users = await User.find({_id: userID});
        let posts = await Post.find({userID: userID}).sort({_id:-1}).limit(10);
        res.render('profile', {
            layout: 'main', 
            title: 'Mooda || Profile',
            users,
            posts,
            user: req.user, 
        });
    });

    //Edit Profile
    app.post('/editprofile/:id', upload.single('avatar'), isLoggedIn, async (req, res) => {
        userID = req.params.id;
        const name = req.body.name;
        const editclass = req.body.class;
        const faculty = req.body.faculty;
        if(!req.file) {
            await User.findByIdAndUpdate(userID, {
                'student.name': name,
                'student.class': editclass,
                'student.faculty': faculty,
            });  
        }
        else {
            await User.findByIdAndUpdate(userID, {
                'student.name': name,
                'student.class': editclass,
                'student.faculty': faculty,
                'avt': req.file.filename
            });
        }

        await Post.updateMany({userID: userID}, {
            userName: name,
        })
        res.redirect('/profile/'+userID);
    });

    //--------------Student List------------//
    //student list
    app.get('/stdlist', isLoggedIn, async(req, res) => {
        let users = await User.find({role: 'student'})
        res.render('stdlist', {
            title: 'Mooda || Student List',
            users,
        });
    });
    //student profile
    app.get('/student/:id', isLoggedIn, async (req, res) => {
        userID = req.params.id;
        let users = await User.find({_id: userID});
        let posts = await Post.find({userID: userID}).sort({_id:-1}).limit(10);
        res.render('student', {
            layout: 'main', 
            title: 'Mooda || Profile',
            users,
            posts,
            user: req.user, 
        });
    });
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

