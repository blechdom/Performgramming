var express = require('express')
  , http = require('http')
  , stylus = require('stylus')
  , nib = require('nib');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(8888);

//OSC STUFF added by kevyb
var osc = require('./omgosc.js');
//var say = require('./node_modules/say/lib/say.js');
//var play = require('./node_modules/play/lib/play.js');


var sender = new osc.UdpSender('192.168.0.7', 7777);
//end OSC STUFF

// routing
app.get('/', function (req, res) {
  console.log('Welcome to Performgramming');
 // res.sendfile(__dirname + '/chat.html');
  res.sendfile(__dirname + '/index.html');
});
app.configure(function () {
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);

  function compile (str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  };
});
// usernames which are currently connected to the chat
var nicknames = {};

io.sockets.on('connection', function (socket) {
	//OSC receiver	
	var receiver = new osc.UdpReceiver(8888);
	receiver.on('', function(e) {
		console.log(e);
		io.sockets.emit('dataReceived', e.params[0]);
	//    say.speak('Alex', e.params[0]);
	});
	//  play.sound('snd/MTBrain.wav');

	// when the client emits 'sendchat', this listens and executes
	socket.on('user message', function (msg) {
    	socket.broadcast.emit('user message', socket.nickname, msg);
    	sender.send('/chat_data',
		              'ss',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
		              [socket.nickname, msg]);
  	});
	//socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
	//	io.sockets.emit('updatechat', socket.username, data);
//    say.speak('Alex', data);
//		sender.send('/chat_data',
//		              'ss',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
//		              [socket.username, data]);
//	});

	// when the client emits 'adduser', this listens and executes
	/*socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		delete usernames[socket.username];
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);*/
//		sender.send('/newusername',
//		              's',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
//		              [socket.username]);
//	});

	socket.on('nickname', function (nick, fn) {
	    if (nicknames[nick]) {
	      fn(true);
	    } else {
	      fn(false);
	      nicknames[nick] = socket.nickname = nick;
	      socket.broadcast.emit('announcement', nick + ' connected');
	      io.sockets.emit('nicknames', nicknames);
	      sender.send('/newusername',
		              's',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
		              [socket.nickname]);
	    }
	  });
		
		

		// when the user disconnects.. perform this
		/*socket.on('disconnect', function(){
			// remove the username from global usernames list
			delete usernames[socket.username];
			// update list of users in chat, client-side
			io.sockets.emit('updateusers', usernames);
			// echo globally that this client has left
			socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		});*/
	socket.on('disconnect', function () {
	    if (!socket.nickname) return;

	    delete nicknames[socket.nickname];
	    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
	    socket.broadcast.emit('nicknames', nicknames);
	  });
});
