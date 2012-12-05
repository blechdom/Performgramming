var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);


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
  res.sendfile(__dirname + '/chat.html');
});

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {
	var receiver = new osc.UdpReceiver(8888);
	
	receiver.on('', function(e) {
		console.log(e);
		io.sockets.emit('dataReceived', e.params[0]);
//    say.speak('Alex', e.params[0]);
	});
//  play.sound('snd/MTBrain.wav');

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
//    say.speak('Alex', data);
//		sender.send('/chat_data',
//		              'ss',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
//		              [socket.username, data]);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
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
		io.sockets.emit('updateusers', usernames);
//		sender.send('/newusername',
//		              's',			//'sfiTFNI', set data types to be separated by commas below or spaces in msg.
//		              [socket.username]);
	});
	
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});
