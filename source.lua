Users = Users or {}
Posts = Posts or {}
-- index to store comments by PostId
CommentsByPostId = CommentsByPostId or {}

Handlers.add(
    "echo",
    Handlers.utils.hasMatchingTag("Action", "Echo"),
    function (msg)
        Handlers.utils.reply(msg.Data .. " (echoed)")(msg)
    end
)

Handlers.add(
    "register",
    Handlers.utils.hasMatchingTag("Action", "Register"),
    function (msg)
        -- get the nick
        local nick = msg.Data
        -- make sure nick is not empty
        if nick == "" then
            Handlers.utils.reply("Error: nickname cannot be empty")(msg)
            return
        end

        -- make sure nick is not already registered
        for _, user in ipairs(Users) do
            if user.Nick == nick then
                Handlers.utils.reply("Error: nickname already registered")(msg)
                return
            end
        end

        local from = msg.From
        table.insert(Users, {Nick = nick, From = from})
        Handlers.utils.reply("registered")(msg)
    end
)

Handlers.add(
    "post",
    Handlers.utils.hasMatchingTag("Action", "Post"),
    function (msg)
        local from = msg.From
        local data = msg.Data
        -- take the last one as id
        local postid = #Posts + 1

        local nick = ""
        for _, user in ipairs(Users) do
            if user.From == from then
                nick = user.Nick
                break
            end
        end

        if nick == "" then
            Handlers.utils.reply("Error: not registered")(msg)
            return
        end

        -- add post
        local datetime = os.date("%Y-%m-%d %H:%M:%S")
        table.insert(Posts, {Nick = nick, Data = data, Time = datetime, From = from, Id = postid})
    end
)

Handlers.add(
    "comment",
    Handlers.utils.hasMatchingTag("Action", "Comment"),
    function (msg)
        local from = msg.From
        local data = msg.Data
        local postid = msg.PostId

        local nick = ""
        for _, user in ipairs(Users) do
            if user.From == from then
                nick = user.Nick
                break
            end
        end

        if nick == "" then
            Handlers.utils.reply("Error: not registered")(msg)
            return
        end

        -- create comment
        local datetime = os.date("%Y-%m-%d %H:%M:%S")
        local comment = {Nick = nick, Data = data, Time = datetime, From = from, PostId = postid}
        
        -- Add comment
        table.insert(Comments, comment)
        
        -- Index comment by PostId
        if CommentsByPostId[postid] == nil then
            CommentsByPostId[postid] = {}
        end
        table.insert(CommentsByPostId[postid], comment)
        
    end
)

-- Getter function for comments by PostId
function GetCommentsByPostId(postid, limit, offset)
    offset = offset or 1
    limit = limit or #CommentsByPostId[postid]

    local result = {}
    for i=offset, offset+limit-1 do
        if CommentsByPostId[postid][i] then
            table.insert(result, CommentsByPostId[postid][i])
        else
            break
        end
    end
    return result
end

-- Getter function for posts with limits
function GetPosts(limit, offset)
    offset = offset or 1
    limit = limit or #Posts

    local result = {}
    for i=offset, offset+limit-1 do
        if Posts[i] then
            table.insert(result, Posts[i])
        else
            break
        end
    end
    return result
end

-- Getter function for posts with limits in reverse order
function GetPostsReverse(limit, offset)
    offset = offset or #Posts
    limit = limit or #Posts

    local result = {}
    local count = 0
    for i = offset, 1, -1 do
        if Posts[i] then
            table.insert(result, Posts[i])
            count = count + 1
            if count == limit then break end
        else
            break
        end
    end
    return result
end

Handlers.add(
    "getPostsReverse",
    Handlers.utils.hasMatchingTag("Action", "GetPostsReverse"),
    function (msg)
        local limit = msg.Data or #Posts
        local offset = msg.Offset or #Posts

        local result = GetPostsReverse(limit, offset)

        Handlers.utils.reply(result)(msg)
    end
)

Handlers.add(
    "getPosts",
    Handlers.utils.hasMatchingTag("Action", "GetPosts"),
    function (msg)
        local limit = msg.Limit or #Posts
        local offset = msg.Offset or 1

        local result = GetPosts(limit, offset)

        Handlers.utils.reply(result)(msg)
    end
)

Handlers.add(
    "getCommentsByPostId",
    Handlers.utils.hasMatchingTag("Action", "GetCommentsByPostId"),
    function (msg)
        local postid = msg.PostId

        if postid == nil then
            Handlers.utils.reply("Error: PostId cannot be nil")(msg)
            return
        end

        local limit = msg.Limit or #CommentsByPostId[postid]
        local offset = msg.Offset or 1

        local result = GetCommentsByPostId(postid, limit, offset)

        Handlers.utils.reply(result)(msg)
    end
)

-- Handlers.add(
--     "leaveroom",
--     Handlers.utils.hasMatchingTag("Action", "LeaveRoom"),
--     function (msg)
--         local nick = msg.Nick
--         local from = msg.From
--         local room = msg.Room
--         for i, user in ipairs(RoomUsers) do
--             if user.Nick == nick and user.From == from and user.Room == room then
--                 table.remove(RoomUsers, i)
--                 Handlers.utils.reply("left room")(msg)

--                 -- send a message to the room
--                 sendToRoom(room, "User " .. nick .. " left the room.")
--                 return
--             end
--         end
--         Handlers.utils.reply("not in room")(msg)
--     end
-- )

-- Handlers.add(
--   "broadcast",
--   Handlers.utils.hasMatchingTag("Action", "Broadcast"),
--   function (msg)
--     for _, recipient in ipairs(Users) do
--       ao.send({Target = recipient.From, Data = msg.Data})
--     end
--     Handlers.utils.reply("Broadcasted.")(msg)
--   end
-- )

-- Handlers.add(
--     "roombroadcast",
--     Handlers.utils.hasMatchingTag("Action", "RoomBroadcast"),
--     function (msg)
--         local room = msg.Room
--         for _, recipient in ipairs(RoomUsers) do
--             if recipient.Room == room then
--                 ao.send({Target = recipient.From, Data = msg.Data})
--             end
--         end
--         Handlers.utils.reply("RoomBroadcasted.")(msg)
--     end
-- )