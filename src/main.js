const { init, uploadToArweave, getWalletAddress } = require("./common");
const { sendAction, getInbox } = require("./aos");

// const fs = require("fs");

window.connected = false;

const lsPrefix = "ao-1-";
const getFromLocalStorage = (key) => {
    return window.localStorage.getItem(lsPrefix + key);
};
const setToLocalStorage = (key, value) => {
    return window.localStorage.setItem(lsPrefix + key, value);
};

const tryShowConnected = async() => {
    $("#connection").html("&checkmark; Connected! Address: " + await getWalletAddress(wallet));
    window.connected = true;
    $('#connect').hide();
    $('#first').text('Status:');

    $('#posts').html('Loading posts...');
    loadPosts();
    setInterval(loadPosts, 10000);

    if (!getFromLocalStorage('nickname')) {
        $('#choose-nickname').show();
    } else {
        $('#connection').append('<br>Nickname: @' + getFromLocalStorage('nickname'));
        $('#choose-nickname').hide();
        $('#submit-wrapper').show();
    }
};

const loadPosts = async() => {
    const resdata = await sendAction("GetPostsReverse", "");
    console.log('loadPosts', {resdata});

    $('#posts').html('');

    resdata.Messages[0].Tags.forEach(tag => {
        if (tag.Nick) {
            const nick = tag.Nick;
            const time = tag.Time;
            const data = tag.Data;
            const from = tag.From;
            const id = tag.Id;

            renderPost(id, nick, time, data, from);
        } else {
            console.log("Skipping tag", {tag});
        }
    });
};

{/* <div class="posts">
<div class="post">
    <div class="from">@something (0x9042890348390284)</div>
    <div class="message">Message hello there how are you doing?</div>
    <hr>
    <div class="comments">
        <div class="comment"><div class="comment-from">@someone:</div> commented</div>
        <div class="comment"><div class="comment-from">@someone:</div> commented</div>
        <div class="leave-comment">
            <div class="input-group input-group-sm">
                <input type="text" placeholder="leave a comment" class="form-control form-control-sm" />
                <!-- <button type="button" class="btn btn-primary btn-sm">comment</button> -->
            </div>
        </div>
    </div>
</div>
</div> */}

let contentCache = {};

const loadContent = async(txid, hash) => {
    if (contentCache[hash]) {
        $('.content-'+hash).text(contentCache[hash]);
        return;
    }

    // const realdata = await fetchFromArweave(txid);
    const realdata = await fetch('/'+txid);
    const realdata_data = await realdata.text();

    $('.content-'+hash).text(realdata_data);

    contentCache[hash] = realdata_data;
}

const getContentImmediately = (txid, hash) => {
    if (contentCache[hash]) {
        return contentCache[hash];
    }

    return 'loading...';
}

const renderPost = (id, nick, time, data, from) => {
    const post = $('<div class="post"></div>');
    const fromDiv = $('<div class="from"></div>');
    const messageDiv = $('<div class="message"></div>');
    const commentsDiv = $('<div class="comments"></div>');

    fromDiv.html('@' + nick + ' &middot; ' + time);
    const hash = data.replace(/[^a-zA-Z0-9]/g, '');
    const cont = getContentImmediately(data, hash);
    messageDiv.html("<div class='content-"+hash+"'>"+cont+"</div>");
    loadContent(data, hash);
    setTimeout(() => {
        loadContent(data, hash);
    }, 100);
    setTimeout(() => {
        loadContent(data, hash);
    }, 200);

    post.append(fromDiv);
    post.append(messageDiv);
    post.append('<hr>');
    post.append(commentsDiv);

    $('#posts').append(post);

    const renderComment = (nick, time, data, from) => {
        const comment = $('<div class="comment"></div>');
        const commentFrom = $('<div class="comment-from"></div>');
        const commentMessage = $('<div class="comment-message"></div>');

        commentFrom.html('@' + nick + ' &middot; ' + time);
        const hash = data.replace(/[^a-zA-Z0-9]/g, '');
        commentMessage.html("<div class='content-"+hash+"'></div>");
        loadContent(data, hash);

        comment.append(commentFrom);
        comment.append(commentMessage);

        commentsDiv.append(comment);
    };

    const renderLeaveComment = () => {
        const leaveComment = $('<div class="leave-comment"></div>');
        const inputGroup = $('<div class="input-group input-group-sm"></div>');
        const input = $('<input type="text" placeholder="leave a comment" class="form-control form-control-sm" />');
        const button = $('<button type="button" class="btn btn-primary btn-sm">comment</button>');

        inputGroup.append(input);
        inputGroup.append(button);
        leaveComment.append(inputGroup);

        commentsDiv.append(leaveComment);
    };

    renderLeaveComment();

    // const renderComments = async() => {
    //     const resdata = await sendAction("GetCommentsReverse", id);
    //     console.log('renderComments', {resdata});

    //     resdata.Messages[0].Tags.forEach(tag => {
    //         if (tag.Nick) {
    //             const nick = tag.Nick;
    //             const time = tag.Time;
    //             const data = tag.Data;
    //             const from = tag.From;

    //             renderComment(nick, time, data, from);
    //         }
    //     });
    // };

    // renderComments();
}

const registerNick = async(nick, attempts = 0) => {
    try {
        const resdata = await sendAction("Register", nick);
        return resdata.Messages[0].Data;
    } catch(e) {
        if (attempts > 3) {
            throw e;
        } else {
            console.log("Retrying...");
            return await registerNick(nick, attempts + 1);
        }
    }
};

$(async() => {
    console.log(require('./common'));
    console.log({init, uploadToArweave});

    window.repl = async(cmd, data) => {
        const resdata = await sendAction(cmd, data);
        console.log({resdata});
        return resdata;
    };

    try {
        await tryShowConnected();
    } catch(e) {
        console.log("Not connected yet");
    }

    $('#connect').click(async() => {
        console.log("init...");
        try {
            await tryShowConnected();
        } catch(e) {
            await init();
            await tryShowConnected();
        }
    });

    $('#save').click(async() => {   
        let txt = $('#txt').val();
        console.log({txt});
        const hash = await uploadToArweave(txt);
        console.log('Deployed at https://arweave.net/' + hash);
    });

    $(document).on('keypress', '.leave-comment', async(e) => {
        if (e.which == 13) {
            let txt = $(e.target).val();
            console.log({txt});
            const hash = await uploadToArweave(txt);
            console.log('Deployed at https://arweave.net/' + hash);
            e.preventDefault();
        }
    });

    $(document).on('keypress', '#nickname', async(e) => {
        if (e.which == 13) {
            $('#set-nickname').click();
        }
    });

    $(document).on('keypress', '#txt', async(e) => {
        if (e.which == 13) {
            $('#post').click();
        }
    });

    $(document).on('click', '#post', async(e) => {
        let txt = $('#txt').val();
        console.log({txt});

        txt = txt.trim();
        if (txt.length < 1) {
            alert("Post can't be empty");
            return;
        }

        $('#txt').val('');
        try {
            $('#txt').attr('disabled', true);
            $('#post').attr('disabled', true);    

            const hash = await uploadToArweave(txt);
            console.log('Post Deployed at https://arweave.net/' + hash);
    
            const res = await sendAction("Post", hash);
    
            console.log('Post result', {res});
    
            e.preventDefault();

            $('#posts').html('Loading posts...');
            loadPosts();

            $('#txt').attr('disabled', false);
            $('#post').attr('disabled', false);
        } catch(e) {
            $('#txt').attr('disabled', false);
            $('#post').attr('disabled', false);
            throw e;
        }
    });

    $(document).on('click', '#set-nickname', async(e) => {
        let nick = $('#nickname').val();

        nick = nick.trim();
        nick = nick.replace(/[^a-zA-Z0-9]/g, '');
        nick = nick.toLowerCase();
        $('#nickname').val(nick);

        if (nick.length < 3) {
            alert("Nickname must be at least 3 characters long");
            return;
        }

        $('#nickname').attr('disabled', true);
        $('#set-nickname').attr('disabled', true);
        console.log('Setting nickname', {nick});

        e.preventDefault();

        $('#set-nickname').text('please wait...');

        const resdata = await registerNick(nick);

        console.log('Register', {resdata});

        if (resdata === 'registered') {
            setToLocalStorage('nickname', nick);
            $('#connection').append('<br>Nickname: @' + getFromLocalStorage('nickname'));
            $('#choose-nickname').hide();
            $('#submit-wrapper').show();
        }
    });

    // setTimeout(async() => {
    //     console.log("Sending")

    //     console.log(await getInbox());

    //     // console.log(await sendAction("Echo", "ShouldBeEchoed"));
    //     console.log(await sendAction("Eval", "Handlers"));
    // }, 10000);
})

