const {v4 : uuidv4} = require('uuid');


module.exports = function(server) {

    const io = require('socket.io')(server, {
        transports : ['websocket']
    });

    // 방 정보
    var rooms = [];
    var socketroom = new Map();

    io.on('connection', (socket) => {
        // 서버 구현
        console.log('a user connected : ', socket.id);

        //특정 Socket(클라이언트)이 접속했을때 처리
        //1. 대기방에 방이 있으면 입장
        //2. 대기방에 방이 없으면 방 생성 후 입장
        if(rooms.length > 0) {
            var roomId = rooms.shift();
            socket.join(roomId);
            socket.emit('joinRoom',{roomId: roomId});
            socket.to(roomId).emit('startGame',{roomId: roomId});
            socketroom.set(socket.id, roomId);
        } else {
            var roomId = uuidv4();
            socket.join(roomId);
            socket.emit('createRoom', {roomId: roomId});
            rooms.push(roomId);
            socketroom.set(socket.id, roomId);
           
        }

        //특정 Socket(클라이언트)이 방을 나갔을때 처리
        socket.on('leaveRoom', function(data) {
            var roomId = socketroom.get(socket.id);
            socket.leave(roomId);
            socketroom.delete(socket.id);
            rooms.push(roomId);
            socket.to(roomId).emit('endGame');

            //혼자 들어간 방에서 나갈때 방 삭제
            const roomIdx = rooms.indexOf(roomId);
            if(roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('방 삭제 : ', roomId);
            }
            socketroom.delete(socket.id);
        });

        //소켓(클라이언트) 특정 block을 터치했을때 처리
        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.roomId;
            var blockIndex = playerInfo.blockIndex;

            console.log('doPlayer : ', roomId, 'block index : ',blockIndex);
            socket.to(roomId).emit('doOpponent', {blockIndex: blockIndex});
        });

        socket.on('disconnect', function(reason) {
            console.log('user disconnected : ', socket.id , 'reason : ', reason);
        });
    });
};