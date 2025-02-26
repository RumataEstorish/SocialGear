/*global VKClient, GearHttp, $*/

VKClient.API_CONVERSATION = VKClient.API + 'messages.getConversations?' + VKClient.API_V + '&';
VKClient.API_SEND_MESSAGE = VKClient.API + 'messages.send?' + VKClient.API_V + '&';
VKClient.CHECK_UNREAD_INTERVAL = 10000;
VKClient.HISTORY_MESSAGES_COUNT = 40;

VKClient.prototype.startCheckUnreadMessages = function(onnewmessages) {
	this.isCheckingUnread = true;
	this.onnewmessages = onnewmessages;
	this.checkUnreadMessages(onnewmessages);
};

VKClient.prototype.checkUnreadMessages = function(onnewmessages) {
	var self = this;

	if (!onnewmessages) {
		return;
	}

	setTimeout(function() {
		if (self.isCheckingUnread === false) {
			return;
		}
		self.getUnreadMessagesCount().then(function(count) {
			if (count && count > 0) {
				onnewmessages(count);
			}
		});
		self.checkUnreadMessages(onnewmessages);
	}, VKClient.CHECK_UNREAD_INTERVAL);
};

VKClient.prototype.stopCheckUnreadMessages = function() {
	this.isCheckingUnread = false;
};

/**
 * Find unread message by id
 * @returns 'undefined' if message not found
 */
VKClient.prototype.getUnreadMessageById = function(id) {
	if (!id) {
		throw 'Id not set';
	}

	for (var i = 0; i<this.unreadMessages.length; i++){
		if (this.unreadMessages[i].id === id){
			return this.unreadMessages[i];
		}
	}
};

/**
 * Unread messages count
 */
VKClient.prototype.getUnreadMessagesCount = function() {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	request.open("GET", VKClient.API_CONVERSATION + this.accessTokenArg + "&filter=unread");
	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}
		res = self.getResultFromRequest(request);
		if (!res) {
			d.reject();
			return;
		}

		
		if (res.response && res.response.items && res.response.items.length > 0 && res.response.items[0].conversation && res.response.items[0].conversation.last_message_id === self.lastMessageId){
			return;
		}
		
		if (res.response && res.response.items && res.response.items.length > 0 && res.response.items[0].conversation){
			self.lastMessageId = res.response.items[0].conversation.last_message_id;
		}
		else{
			self.lastMessageId = null;
		}
		
		if (res.response.unread_count){
			d.resolve(res.response.unread_count);
		}
	};

	this.requestQueue.add(request, null);
	//request.send(null);
	return d.promise();
};

/**
 * Get dialogs
 */
VKClient.prototype.getDialogs = function() {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	request.open("GET", VKClient.API_CONVERSATION + this.accessTokenArg + '&extended=1&count=200');
	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}
		res = self.getResultFromRequest(request);
		if (!res) {
			d.reject();
			return;
		}

		d.resolve(res.response);
	};

	//request.send(null);
	this.requestQueue.add(request, null);
	return d.promise();
};

/*VKClient.prototype.markAsAnsweredConversation = function(user, peer){
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();
	
	if (!user){
		d.reject();
		return d.promise();
	}
	
	request.open("GET", this.apiAddress + "messages.markAsAnsweredConversation?" + this.apiVersion + "&access_token=" + this.accessToken + "&peer_id=" + peer.id + "&answered=1&group_id="+ (2000000000+parseInt(user.id)));
	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}

		res = self.getResultFromRequest(request);

		if (!res) {
			d.reject();
			return;
		}
		d.resolve(res.response);
	};
	this.requestQueue.add(request, null);
	
	
	return d.promise();
};*/

VKClient.prototype.getHistory = function(user, count) {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	if (!user) {
		d.reject();
		return d.promise();
	}

	if (!count) {
		count = VKClient.HISTORY_MESSAGES_COUNT;
	}
	
	request.open("GET", this.apiAddress + "messages.getHistory?" + this.apiVersion + "&access_token=" + this.accessToken + "&count=" + count + "&user_id=" + user.id + "&peer_id=" + (user.type ? '-' + user.id : user.id));

	this.stopCheckUnreadMessages();
	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}

		res = self.getResultFromRequest(request);

		if (!res) {
			d.reject();
			return;
		}

		self.startCheckUnreadMessages(self.onnewmessages);
		
	/*	var i = 0, ids = "";
		for (i = 0; i<res.response.items.length; i++){
			ids += res.response.items[i].id + ",";
		}
		self.messageMarkAsRead(ids).then(function() {
			self.onnewmessages([ 0, self.unreadMessages.length ]);
			self.startCheckUnreadMessages(self.onnewmessages);
		});*/
		
	/*

		var i = 0, j = 0, ids = "",;
	for (i = 0; i < res.response.items.length; i += 1) {
			for (j = 0; j < self.unreadMessages.length; j += 1) {
				if (res.response.items[i].id === self.unreadMessages[j].id) {
					ids += res.response.items[i].id + ",";
					self.unreadMessages.splice(j, 1);
				}
			}
		}*/
		/*if (ids.length > 0) {
			ids = ids.substring(0, ids.length - 1);
			self.messageMarkAsRead(ids).then(function() {
				self.onnewmessages([ 0, self.unreadMessages.length ]);
				self.startCheckUnreadMessages(self.onnewmessages);
			});
		} else {*/
			//self.startCheckUnreadMessages(self.onnewmessages);
		//}
		d.resolve(res.response);
	};

	//request.send(null);
	this.requestQueue.add(request, null);
	return d.promise();
};

VKClient.prototype.sendMessage = function(toId, text, peer_id) {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	if (!toId || !text) {
		d.reject();
		return d.promise();
	}

	if (!peer_id) {
		request.open("GET", VKClient.API_SEND_MESSAGE + this.accessTokenArg + "&user_id=" + toId + "&message=" + encodeURIComponent(text) + '&random_id=' + Math.random() * 1000000);
	} else {
		request.open("GET", VKClient.API_SEND_MESSAGE + this.accessTokenArg + "&message=" + encodeURIComponent(text) + "&chat_id=" + peer_id + '&random_id=' + Math.random() * 1000000);
	}

	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}

		res = self.getResultFromRequest(request);

		if (!res) {
			d.reject();
			return;
		}

		d.resolve(res.response);
	};

	//request.send(null);
	this.requestQueue.add(request, null);
	return d.promise();
};

VKClient.prototype.messageMarkAsRead = function(messageid) {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	if (!messageid) {
		d.reject();
		return d.promise();
	}

	request.open("GET", this.apiAddress + "messages.markAsRead?" + this.apiVersion + "&access_token=" + this.accessToken + "&message_ids=" + messageid);

	request.onreadystatechange = function() {
		if (request.request.readyState !== 4) {
			return;
		}

		res = self.getResultFromRequest(request);
		if (!res) {
			d.reject();
			return;
		}
		d.resolve(res.response);
	};

	//request.send(null);
	this.requestQueue.add(request, null);
	return d.promise();
};
