$(document).ready(function(){
    var skip = 10;
    //add Post
    $(document).on('click', '#postbutton', function() {
        var content = document.getElementById("postcontent").value;
        var postImage = document.getElementById("customFile").files;
        var postVideo = getYoutubeID(document.getElementById("videocontent").value);
        if (postVideo == null) {
            postVideo = '#';
        }
        if(postImage.length === 0) {
            var formData = new FormData();
            formData.append("content", content);
            formData.append("video", postVideo);
        }
        
        if(postImage.length === 1) {
            var formData = new FormData();
            formData.append("content", content);
            formData.append("postImage", postImage[0]);
            formData.append("video", postVideo);
        }
        
        $.ajax({
            url: "/post", 
            type: "POST",
            data: formData,
            contentType: false,
            processData: false
        }).done(function(data) {
            $('#postcontent').val("");
            $('#customFile').val("");
            $('#videocontent').val("");
            var User = data.user;
            var Post = data.newPost;
            $('#postlistfield').prepend(`
            <div class="card post `+ Post._id+`">
                <div class="card-header">
                    <div class="row">
                        <a class="card-title col-11" href="/student/`+ User._id +`"><strong>`+ Post.userName +`</strong></a>
                        <div class="dropdown col-1">
                                <a class="fas fa-ellipsis-v" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                                <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                                    <a class="dropdown-item" onclick="togEditpost('editpost`+ Post._id +`')">Edit</a>
                                    <a id="deletepost`+ Post._id +`" value="`+ Post._id +`" class="dropdown-item" href="#">Delete</a>
                                </div>
                            </div>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">`+ Post.postContent +`</p>
                </div>
                <img class="card-img-bottom" src="/uploads/`+ Post.image +`" alt="Card image cap">
                <div>
                    <iframe width="100%" height="345" src="https://www.youtube.com/embed/`+ Post.video +`">
                    </iframe>
                </div>
                <div class="card-footer commentfield">
                    <div class="row inputcmt">
                        <input class="cmtinput col-10" id="cmtcontent`+ Post._id +`" name="cmtcontent" placeholder="Write a comment" type="text">
                        <textarea hidden name="postID" id="post`+ Post._id +`">`+ Post._id +`</textarea>
                        <button class ="col-2 fab fa-telegram-plane" value="`+ Post._id +`" id="cmtbutton`+ Post.id +`"></button>
                    </div>          
                </div>
                <div class="cmtlist" id="cmtlistfield`+ Post._id +`"></div>
            </div>`);
        });
    })

    //add comment
    $('.post').on('click', '[id^=cmtbutton]', function() {
        var id = $(this).attr('value');
        $.ajax({
            url: "/comment",
            type: "POST",
            data: {cmtcontent: $('#cmtcontent'+id).val(), postID: $('#post'+id).val()},
        }).done(function(data) {
            $('[id^=cmtcontent]').val("");
            var User = data.user;
            var content = data.content;
            var postID = data.postID;
            if (User.role === "student") {
                $('#cmtlistfield'+postID).append(`
                <div class="card-footer cmt">
                    <h6>`+ User.student.name +`</h6>
                    <p>`+ content +`</p>
                </div>`);
            }
            
            if (User.role === "admin" || User.role === "department") {
                $('#cmtlistfield'+postID).append(`
                <div class="card-footer cmt">
                    <h6>`+ User.highuser.name +`</h6>
                    <p>`+ content +`</p>
                </div>`);
            }
        });
    })

    //delete post
    $('.post').on('click', '[id^=deletepost]', function() {
        var id = $(this).attr('value');
        $.ajax({
            url: "/delete",
            type: "POST",
            data: {postID: id},
        }).done(function(data) {
            var postID = data.postID;
            $('.'+postID).remove();
        });
    })

    //delete comment
    $('.post').on('click', '[id^=deletecomment]', function() {
        var commentid = $(this).attr('value1');
        var postid = $(this).attr('value2');
        $.ajax({
            url: "/deletecomment",
            type: "POST",
            data: {commentID: commentid, postID: postid},
        }).done(function(data) {
            var commentID = data.commentID;
            $('.'+commentID).remove();
        });
    })

    //editpost
    $('.editpostsrc').on('click', '[id^=confirmedit]', function() {
        var id = $(this).attr('value');
        var newcontent = $('#newcontent'+id).val();
        $.ajax({
            url: "/editpost",
            type: "POST",
            data: {postID: id, newcontent: newcontent},
        }).done(function(data) {
            var User = data.user;
            var Post = data.editedPost;
            var postID = data.postID;
            var newcontent = data.newcontent;
            $('.'+postID).remove();
            $('#postlistfield').prepend(`
            <div class="card post `+ Post._id +`">
                <div class="card-header">
                    <div class="row">
                        <a class="card-title col-11" href="/student/`+ User._id +`"><strong>`+ Post.userName +`</strong></a>
                        <div class="dropdown col-1">
                                <a class="fas fa-ellipsis-v" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                                <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                                    <a class="dropdown-item" onclick="togEditpost('editpost`+ Post._id +`')">Edit</a>
                                    <a id="deletepost`+ Post._id +`" value="`+ Post._id +`" class="dropdown-item" href="#">Delete</a>
                                </div>
                            </div>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">`+ newcontent +`</p>
                </div>
                <img class="card-img-bottom" src="/uploads/`+ Post.image +`">
                <div>
                    <iframe width="100%" height="345" src="https://www.youtube.com/embed/`+ Post.video +`"></iframe>
                </div>
                <div class="card-footer commentfield">
                    <div class="row inputcmt">
                        <input class="cmtinput col-10" id="cmtcontent`+ Post.id +`" name="cmtcontent" placeholder="Write a comment" type="text">
                        <textarea hidden name="postID" id="post`+ Post.id +`">`+ Post.id +`</textarea>
                        <button class ="col-2 fab fa-telegram-plane" value="`+ Post.id +`" id="cmtbutton`+ Post.id +`"></button>
                    </div>          
                </div>
                <div class="cmtlist" id="cmtlistfield`+ Post.id +`"></div>
            </div>`);
        });
    })
    //auto loading
    $(window).scroll(function () {
        let firstPath = window.location.pathname.split('/')[1];
        let profileID = window.location.pathname.split('/')[2];
        if (profileID == undefined) {
            profileID = '';
        }
        if (firstPath == 'home' || firstPath == 'student' || firstPath == 'profile') {
            if ($(window).scrollTop() + $(window).height() == $(document).height()) {
                load10Feed(profileID, skip);
                skip += 10;
            }
        }
    });
}); 

function load10Feed(profileID, skip) {
    $.post('/get10feed', {profileID: profileID, skip: skip}, function (data) {
        data.posts.forEach(function (Post) {
            $('#postlistfield').append(`
            <div class="card post `+ Post._id +`">
                <div class="card-header">
                    <div class="row">
                        <a class="card-title col-11" href="/student/`+ Post.userID +`"><strong>`+ Post.userName +`</strong></a>
                        <div class="dropdown col-1">
                                <a class="fas fa-ellipsis-v" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                                <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                                    <a class="dropdown-item" onclick="togEditpost('editpost`+ Post._id +`')">Edit</a>
                                    <a id="deletepost`+ Post._id +`" value="`+ Post._id +`" class="dropdown-item" href="#">Delete</a>
                                </div>
                            </div>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">`+ Post.postContent +`</p>
                </div>
                <img class="card-img-bottom" src="/uploads/`+ Post.image +`">
                <div>
                    <iframe width="100%" height="345" src="https://www.youtube.com/embed/`+ Post.video +`"></iframe>
                </div>
                <div class="card-footer commentfield">
                    <div class="row inputcmt">
                        <input class="cmtinput col-10" id="cmtcontent`+ Post.id +`" name="cmtcontent" placeholder="Write a comment" type="text">
                        <textarea hidden name="postID" id="post`+ Post.id +`">`+ Post.id +`</textarea>
                        <button class ="col-2 fab fa-telegram-plane" value="`+ Post.id +`" id="cmtbutton`+ Post.id +`"></button>
                    </div>          
                </div>
                <div class="cmtlist" id="cmtlistfield`+ Post.id +`"></div>
            </div>`);
        });
    });
}

function togMenu() {
    var nav = document.getElementById("leftMenu");
    if (nav.style.width == '300px') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "300px";
        nav.style.opacity = 1;
    }
}

function closeMenu() {
    document.getElementById("leftMenu").style.width = "0";
}

function togNoti() {
    var nav = document.getElementById("notilist");
    if (nav.style.height == '70%') {
        nav.style.height = '0';
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.height = "70%";
        nav.style.width = "20%";
        nav.style.opacity = 1;
    }
}

function togEdit() {
    var nav = document.getElementById("edit");
    if (nav.style.width == '100%') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "100%";
        nav.style.opacity = 1;
    }
}

function closeEdit() {
    document.getElementById("edit").style.width = "0";
}

function togEditpost(post) {
    var nav = document.getElementById(post);
    if (nav.style.width == '100%') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "100%";
        nav.style.opacity = 1;
    }
}

function closeEditpost(post) {
    document.getElementById(post).style.width = "0";
}

function togEditpwd() {
    var nav = document.getElementById("editpwd");
    if (nav.style.width == '100%') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "100%";
        nav.style.opacity = 1;
    }
}

function closeEditpwd() {
    document.getElementById("editpwd").style.width = "0";
}

function togCrt() {
    var nav = document.getElementById("createdpt");
    if (nav.style.width == '100%') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "100%";
        nav.style.opacity = 1;
    }
}

function closeCrt() {
    document.getElementById("createdpt").style.width = "0";
}

function togAddPms() {
    var nav = document.getElementById("permission");
    if (nav.style.width == '100%') {
        nav.style.width = '0';
        nav.style.opacity = 0;
    } 
    else {
        nav.style.width = "100%";
        nav.style.opacity = 1;
    }
}

function closePms() {
    document.getElementById("permission").style.width = "0";
}

function getYoutubeID(url) {
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[7].length == 11) {
        let id = match[7];
        return id;
    } else {
        return null;
    }
}

  