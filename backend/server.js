const { log } = require('console');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');


const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: 'http://localhost:5173'
});


const allUsers = {};


io.on('connection', (socket) => {

    allUsers[socket.id] = {
        socket: socket,
        online: true
    }

    
    socket.on('request_to_play', (data) => {
        const currentUser = allUsers[socket.id];
        currentUser.playerName = data.playerName;
        
        let opponentPlayer;

        for (const key in allUsers) {
            const user = allUsers[key];
            if(user.online && !user.playing && socket.id !== key){
                opponentPlayer = user;
                break;
            }    
        }

        if(opponentPlayer){
            opponentPlayer.socket.emit('OpponentFound', {
                opponentName: currentUser.playerName,
                playingAs: "circle"
            })

            currentUser.socket.emit('OpponentFound', {
                opponentName: opponentPlayer.playerName,
                playingAs: "cross"
            })

            currentUser.socket.on('playerMoveFromClient', (data) => {
                opponentPlayer.socket.emit('playerMoveFromServer', {
                    ...data
                })
            })

            opponentPlayer.socket.on('playerMoveFromClient', (data) => {
                currentUser.socket.emit('playerMoveFromServer', {
                    ...data
                })
            })
        }
        else{
            currentUser.socket.emit('OpponentNotFound')
        }

    });



    socket.on('disconnect', function () {
        const currentUser = allUsers[socket.id];
        currentUser.online = false;
    })
});

server.listen(PORT);