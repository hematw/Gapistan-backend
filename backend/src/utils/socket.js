import { Server as IOServer } from "socket.io";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { getDefaultChatE2EE } from "../config/e2ee.js";

let io = null;
export const userSockets = {};

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
];

export default function initSocket(server) {
    if (!io) {
        io = new IOServer(server, {
            cors:
             {
                origin: "*", // or  for dev
                methods: ["GET", "POST"],
                credentials: true,
                //  origin: allowedOrigins 
            },
        });
    }

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("typing", (...args) => handleTyping(socket, ...args));
        socket.on("message", (...args) => handleMessage(socket, ...args));
        socket.on("disconnect", () => handleDisconnect(socket));
        socket.on("user-online", (...args) => handleUserOnline(socket, ...args));
        socket.on("mark-as-seen", (...args) => handleMarkAsSeen(socket, ...args));
        socket.on("send-message", (...args) => handleSendMessage(socket, ...args));
        socket.on("message-delivered", (...args) => handleMessageDelivery(socket, ...args));
        socket.on("message-seen", (...args) => handleMessageSeen(socket, ...args));
        socket.onAny((eventName, args) => {
            console.log(eventName, args);
        });

        socket.on('start-call', ({ toUserId, fromUserId, roomName, isGroup, from }) => {
            if (isGroup) {
                socket.to(roomName).emit('incoming-call', {
                    fromUserId,
                    roomName,
                    from,
                });
            } else {

                const targetSocketId = userSockets[toUserId];
                if (targetSocketId) {
                    console.log(`Starting call from ${fromUserId} to ${toUserId} in room ${roomName}`);
                    targetSocketId.emit('incoming-call', {
                        fromUserId,
                        roomName,
                        from,
                    });
                }
            }
        });

        socket.on('call-rejected', ({ toUserId, roomName }) => {
            const callerSocket = userSockets[toUserId];
            if (callerSocket) {
                callerSocket.emit('call-rejected', { roomName });
            }
        });

        socket.on('accept-call', ({ toUserId, roomName }) => {
            const callerSocket = userSockets[toUserId];
            if (callerSocket) {
                callerSocket.emit('call-accepted', { roomName });
            }
        });

        socket.on('call-timeout', ({ toUserId, roomName }) => {
            const receiverSocket = userSockets[toUserId];
            if (receiverSocket) {
                receiverSocket.emit('call-timeout', { roomName });
            }
        });

    });
}

export { io };

const handleMessage = (socket, { text, receiver }, cb) => {
    console.log("Message received:", text, receiver);

    const message = {
        date: "9 Sep 2024",
        events: [],
        chats: [
            {
                sender: "You",
                time: "6:10 PM",
                text: text,
                isYou: true,
            },
        ],
    };

    socket.broadcast.emit("message", text); // Broadcast to all
    cb({ message });
}

const handleUserOnline = async (socket, { userId, isOnline }) => {
    console.log("User online: 🟢", userId);

    if (!userId) return;

    socket.userId = userId;
    userSockets[userId] = socket;
    console.log(`User ${userId} registered with socket ID ${socket.id} 🆔`);

    socket.broadcast.emit("update-status", { userId, isOnline });

    try {
        const user = await User.findByIdAndUpdate(userId, {
            isOnline,
            lastSeen: null,
        });
        if (user) {
            console.log("User status updated to online:", user.username);
        } else {
            console.log("User not found:", userId);
        }

        // 👇 Update all messages sent to this user that are still in "sent" status
        const chats = await Chat.find({ members: userId }).select(
            "_id members isGroup "
        );

        for (const chat of chats) {
            const messagesToUpdate = await Message.find({
                chat: chat._id,
                status: "sent",
                sender: { $ne: userId },
            }).select("_id sender");

            if (messagesToUpdate.length > 0) {
                const messageIds = messagesToUpdate.map((m) => m._id);

                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { status: "delivered" }
                );

                // 🔔 Notify the senders of those messages (only the senders)
                const groupedBySender = {};
                for (const msg of messagesToUpdate) {
                    if (!groupedBySender[msg.sender]) groupedBySender[msg.sender] = [];
                    groupedBySender[msg.sender].push(msg._id);
                }

                for (const [senderId, msgIds] of Object.entries(groupedBySender)) {
                    const senderSocket = userSockets[senderId];
                    if (senderSocket) {
                        senderSocket.emit("messages-delivered", {
                            chatId: chat._id,
                            messageIds: msgIds,
                        });
                    }
                }
            }

            if (chat.isGroup) {
                socket.join(chat._id.toString())
                console.log(userId, `joined to group room ${chat._id}`)
            }
        }
    } catch (error) {
        console.error("Error updating user status:", error);
    }
}

const handleMarkAsSeen = async (socket, { chatId, userId }) => {
    try {
        const messagesToUpdate = await Message.find({
            chat: chatId,
            status: "delivered",
            sender: { $ne: userId } // not the current user
        }).select("_id sender");

        const messageIds = messagesToUpdate.map(m => m._id);

        if (messageIds.length === 0) return;

        // Update status to "seen"
        await Message.updateMany(
            { _id: { $in: messageIds } },
            { status: "seen" }
        );

        // Notify original senders (if online)
        const senders = [...new Set(messagesToUpdate.map(m => m.sender.toString()))];

        senders.forEach(senderId => {
            const senderSocket = userSockets[senderId];
            if (senderSocket) {
                senderSocket.emit("message-seen", {
                    chatId,
                    messageIds
                });
            }
        });
    } catch (err) {
        console.error("❌ Error in mark-as-seen:", err);
    }
}

const handleSendMessage = async (socket,
    { chatId, text, files = [], reactions, senderId, receiverId, replyTo, iv },
    cb
) => {
    // const { chatId, text, mediaType, reactions, userId } = data;
    console.log("Message received:", chatId, text, files, reactions, senderId, receiverId, replyTo, iv);
    try {
        let chatToSendMessage;

        if (chatId) {
            console.log("Exist ✅");
            chatToSendMessage = await Chat.findOne({
                _id: chatId,
                members: senderId,
            });


        } else {
            console.log("❌ not exist");
            const { doc, created } = await Chat.findOrCreate(
                {
                    members: [senderId, receiverId],
                },
                {
                    members: [senderId, receiverId],
                    e2eeEnabled: getDefaultChatE2EE(),
                },
            );
            console.log(chatToSendMessage)
            chatToSendMessage = doc;

            chatToSendMessage = await Chat.findById(chatToSendMessage._id)
                .populate("members", "_id firstName lastName username profile")

            if (created) {
                const senderUser = await User.findById(senderId);
                const receiverUser = await User.findById(receiverId);
                // const memberExceptSender = doc.members.filter(p => p.toString() != socket.userId)
                for (const member of doc.members) {
                    const memberSocket = userSockets[member.toJSON()]
                    if (memberSocket) {
                        const meOrOther = member == senderUser._id.toString() ? receiverUser : senderUser;
                        memberSocket.emit("new-chat", {
                            ...chatToSendMessage.toJSON(),
                            profile: meOrOther.profile,
                            chatName: meOrOther.firstName ? `${meOrOther.firstName} ${meOrOther.lastName}` : meOrOther.username,
                            senderId

                        })
                    }
                }
            }
        }

        if (!chatToSendMessage) {
            return cb({ error: "Chat not found or user not in chat" });
        }

        // let mediaUrl = null;

        const savedMessage = await Message.create({
            sender: senderId,
            chat: chatToSendMessage._id,
            text,
            files: files.map((file) => file._id),
            replyTo: replyTo?._id,
            reactions: reactions || [],
            iv: iv
        });

        chatToSendMessage.lastMessage = savedMessage._id;
        await chatToSendMessage.save();

        const sender = await User.findById(senderId);

        if (chatToSendMessage.isGroup) {
            socket.to(chatToSendMessage._id.toString()).emit("message-received", {
                ...savedMessage.toJSON(),
                isYou: false,
                sender: sender || senderId,
                files,
                replyTo
            })
        } else {
            let otherUser = chatToSendMessage.members.find(
                (p) => p._id.toString() !== senderId
            );
            const receiverSocket = userSockets[otherUser._id];

            if (receiverSocket) {
                console.log("User is Online 🔰");
                savedMessage.status = "delivered";
                await savedMessage.save();
                receiverSocket.emit("message-received", {
                    ...savedMessage.toJSON(),
                    isYou: false,
                    sender: sender || senderId,
                    files,
                    replyTo
                });
            } else {
                console.log(`${otherUser._id} is offline `, "💀💀💀");
            }
        }

        cb({
            message: "Message sent.",
            data: {
                ...savedMessage.toJSON(),
                isYou: true,
                sender: sender || senderId,
                files,
                replyTo
            },
        });
    } catch (error) {
        console.error("Error sending message:", error);
        cb({ message: "Error sending message using socket", error });
    }
}

const handleTyping = (socket, { chatId, userId, isTyping, timestamp, content }) => {
    console.log(
        `User ${userId} is ${isTyping ? "typing" : "not typing"
        } in chat ${chatId} at ${timestamp}`
    );

    // Broadcast typing event to other members in the chat
    socket.broadcast.emit("typing", { chatId, userId, isTyping, timestamp, content });
}

const handleMessageDelivery = async (socket, { messageId }) => {
    const message = await Message.findById(messageId);
    if (message) {
        message.status = "delivered";
        await message.save();
    } else {
        console.error(`Message with id ${messageId} NOT found`);
    }
}

const handleMessageSeen = async (socket, { chatId }) => {
    const chat = await Chat.findById(chatId);

    if (chat) {
        await Message.updateMany(
            {
                chat: chat._id,
                status: { $ne: "seen" },
                sender: { $ne: socket.userId },
            },
            { status: "seen" }
        );
    } else {
        console.error(`Chat with id ${chatId} NOT found`);
    }
}

const handleDisconnect = async (socket) => {
    console.log("User disconnected: 😵", socket.id, socket.userId);
    const userId = socket.userId;
    socket.broadcast.emit("update-status", {
        userId,
        isOnline: false,
        lastSeen: new Date(),
    });
    try {
        const user = await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
        });

        if (user) {
            console.log("User status updated to offline: 🔴", userId);
        } else {
            console.log("User not found:", userId);
        }
        delete userSockets[userId];
        console.log(
            `User ${userId} unregistered from socket ID ${socket.id} 🆔`
        );
    } catch (error) {
        console.error("Error updating user status:", error);
    }
}