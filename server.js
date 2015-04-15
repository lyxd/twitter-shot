var Server = require('http');
var Twitter = require('twitter');
var io = require('socket.io');
var fs = require('fs');
var _ = require('lodash');

//Create server
var server = Server.createServer(function(req, res) {
	fs.readFile(__dirname + '/index.html', function(err, data) {
		if(err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
});

server.listen(8080);


var TStream = function(twitterDependency) {
	this.count = 0;
	this.streamActive = false;
	this.subscribers = [];
	this.track = 'fuck';
	this.stream = null;
	this.twitter = twitterDependency
};

TStream.prototype.addSubscriber = function(subscriber) {
	this.subscribers.push(subscriber);
	return this;
};

TStream.prototype.setTrack = function(track) {
	this.track = track;
	return this;
};

TStream.prototype.startStream = function() {

	this.twitter.stream('statuses/filter', {track: this.track}, _.bind(function (stream) {

		this.streamActive = true;

		stream.on('data', _.bind(function (tweet) {
			_.each(this.subscribers, function (socket) {
				socket.emit('tweet', {
					text: tweet.text,
					name:tweet.user.name,
					avatar: tweet.user.profile_image_url
				});
			});
		}, this));

		stream.on('error', _.bind(function (error) {
			_.each(this.subscribers, function (socket) {
				socket.emit('tweetError', {data: error.text});
			});
			this.restartStream();
		}, this));

		this.stream = stream;

	}, this));

	return this;

};

TStream.prototype.stopStream = function() {
	this.stream.destroy();
	return this;
};

TStream.prototype.restartStream = function() {
	this.stopStream();
	setTimeout(_.bind(function() {
		console.log('startStream');
		this.startStream();
	}, this), 1000 * 5);
	return this;
};


var twitterConnection = new Twitter({
		consumer_key: 'sD0XEQY68qlPzDcdAxvemMlvd',
		consumer_secret: 'wfvyV8Tkl6GYzlEziKZefAU3xKyI5uG5ImGB5nOm7kZoS6ore3',
		access_token_key: '3104388779-wydNPtD31fXlMKzuEMRWh5fG7seChDHV7QJdwwM',
		access_token_secret: 'aM4xMMKhXEKOUVGeCWeO7foaySDn4XNj96ivYkhRGf5Dr'
	});

var twitterStream = new TStream(twitterConnection);

twitterStream.setTrack('lol');


//Start io
io(server).on('connection', function(socket) {

	socket.on('stopStream', twitterStream.stopStream);

	socket.on('setAnotherTrack', function(data) {
		console.log(data);
		twitterStream.setTrack(data.track);
		twitterStream.restartStream();
	});

	twitterStream.addSubscriber(socket);

	if(!twitterStream.streamActive) {
		twitterStream.streamActive = true;
		twitterStream.startStream();
	}
});






////Create twitter
//var twitter ;
//
//
//var sockets = [];
//var tweetStreamActive = false;
//var i = 0;
//
//var streamCopy = null;
//
//function startStream(track) {
//	twitter= new Twitter({
//		consumer_key: 'sD0XEQY68qlPzDcdAxvemMlvd',
//		consumer_secret: 'wfvyV8Tkl6GYzlEziKZefAU3xKyI5uG5ImGB5nOm7kZoS6ore3',
//		access_token_key: '3104388779-wydNPtD31fXlMKzuEMRWh5fG7seChDHV7QJdwwM',
//		access_token_secret: 'aM4xMMKhXEKOUVGeCWeO7foaySDn4XNj96ivYkhRGf5Dr'
//	});
//
//	twitter.stream('statuses/filter', {track: track}, function (stream) {
//		stream.on('data', function (tweet) {
//			console.log(i++);
//			_.each(sockets, function (socket) {
//				socket.emit('tweet', {
//					text: tweet.text,
//					name:tweet.user.name,
//					avatar: tweet.user.profile_image_url
//				});
//			});
//		});
//		stream.on('error', function (error) {
//			_.each(sockets, function (socket) {
//				socket.emit('tweetError', {data: error.text});
//			});
//		});
//
//		streamCopy = stream;
//	});
//}
//
//function stopStream() {
//	console.log('stopStream');
//	twitter = undefined;
//	console.log(streamCopy.destroy());
//	tweetStreamActive = false;
//}







