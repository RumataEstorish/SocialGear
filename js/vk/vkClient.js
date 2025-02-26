/*global RequestQueue, GearHttp, Utils, $, Log, Feed*/

VKClient.APP_ID = "YOUR_ID_HERE";
VKClient.USER_FIELDS = "&fields=photo_50,photo_200,bdate,city,followers_count,counters";
VKClient.API = 'https://api.vk.com/method/';
VKClient.API_V = 'v=5.131';

function VKClient(sap, authneeded, ontokenexpired, onerror) {
	var self = this, requestQueue = new RequestQueue(), feed = new Feed(), unreadMessages = [], user = localStorage.getItem('USER'), accessToken = null, isCheckingUnread = false, checkUnread = Utils.stringToBoolean(localStorage.getItem("checkUnread"), false), lastMessageId = null, model = null;
	
	isCheckingUnread = checkUnread;

	this.ontokenexpired = ontokenexpired;
	this.authneeded = authneeded;
	this.sap = sap;
	this.onerror = onerror;

	this.onnewmessages = null;
	
	if (user && user !== ''){
		user = JSON.parse(user);
	}

	accessToken = localStorage.getItem("accessToken");

	if (Log.DEBUG === true){
		accessToken = "YOUR_TEST_ACCESS_TOKEN_HERE_IF_LOG_DEBUG_IS_TURNED_ON";
	}

	if (!accessToken && accessToken !== "" && authneeded) {
		authneeded();
	}
	
	Object.defineProperty(this, 'model', {
		get : function(){
			return model;
		},
		set : function(val){
			model = val;
		}
	});
	
	Object.defineProperty(this, 'lastMessageId', {
		get : function(){
			return lastMessageId;
		},
		set : function(lmi){
			lastMessageId = lmi;
		}
	});

	Object.defineProperty(this, 'apiVersion', {
		get : function() {
			return 'v=5.95';
		}
	});

	Object.defineProperty(this, 'isAuthorized', {
		get : function() {
			return !(!accessToken || accessToken === '');
		}
	});

	Object.defineProperty(this, 'user', {
		get : function() {
			return user;
		},
		set : function(val) {
			user = val;
			localStorage.setItem('USER', JSON.stringify(val));
		}
	});
	
	Object.defineProperty(this, 'feed', {
		get : function(){
			return feed;
		}
	});

	/**
	 * Check new messages
	 */
	Object.defineProperty(this, "checkUnread", {
		get : function() {
			return checkUnread;
		},
		set : function(val) {
			checkUnread = val;
			if (val === false) {
				self.stopCheckUnreadMessages();
			}
			localStorage.setItem("checkUnread", val);
		}
	});

	/**
	 * AccessToken
	 */
	Object.defineProperty(this, 'accessToken', {
		get : function() {
			return accessToken;
		},
		set : function(val) {
			localStorage.setItem('accessToken', val);
			if (accessToken !== val) {
				self.feed.nextFrom = null;
			}
			accessToken = val;
			if (!self.isAuthorized) {
				this.user = null;
			}
		}
	});
	
	Object.defineProperty(this, 'accessTokenArg', {
		get : function(){
			return 'access_token=' + accessToken;
		}
	});

	Object.defineProperty(this, 'unreadMessages', {
		get : function() {
			return unreadMessages;
		}
	});

	Object.defineProperty(this, 'isCheckingUnread', {
		get : function() {
			return isCheckingUnread;
		},
		set : function(val) {
			isCheckingUnread = val;
		}
	});

	Object.defineProperty(this, 'apiAddress', {
		get : function() {
			return VKClient.API;
		}
	});
	
	Object.defineProperty(this, 'requestQueue',{
		get : function(){
			return requestQueue;
		}
	});
}

/**
 * Get user info
 * 
 * @param id - id of user. If null, the info for current user
 */
VKClient.prototype.getUser = function(id) {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();
	
	request.open("GET", this.apiAddress + "users.get?" + this.apiVersion + (id ? "&user_ids=" + id : '') + "&access_token=" + this.accessToken + VKClient.USER_FIELDS);
	request.onreadystatechange = function() {
		
		if (request.request.readyState !== 4) {
			return;
		}
		
		res = self.getResultFromRequest(request);
		if (!res) {
			d.reject();
			return;
		}
		if (!id) {
			self.user = res.response[0];
		}
		d.resolve(res.response[0]);
	};

	this.requestQueue.add(request, null);
	//request.send(null);
	return d.promise();
};


VKClient.prototype.getUserPhoto = function(user) {
	if (!user) {
		return null;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_200) {
		return user.photo_200;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_50) {
		return user.photo_50;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_100) {
		return user.photo_100;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_max) {
		return user.photo_max;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_200_orig) {
		return user.photo_200_orig;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_400_orig) {
		return user.photo_400_orig;
	}

	// noinspection JSUnresolvedVariable
	if (user.photo_max_orig) {
		return user.photo_max_orig;
	}
};

VKClient.prototype.getFriends = function(id) {
	var self = this, request = new GearHttp(this.sap), res = null, d = $.Deferred();

	if (!id) {
		id = this.user.uid;
	}
	request.open("GET", this.apiAddress + "friends.get?" + this.apiVersion + "&user_id=" + id + "&access_token=" + this.accessToken + VKClient.USER_FIELDS);

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
	//request.send(null);
	return d.promise();
};

/**
 * Check if token is expired
 * @param request - request to check
 * @returns true if expired, false if not
 */
VKClient.prototype.checkTokenExpired = function(request) {
	var r = null;

	if (request.request.readyState === 3) {
		try {
			r = JSON.parse(request.request.responseText);
			if (r.error && r.error.message && r.error.message === "(#100) Error finding the requested story") {
				return "(#100) Error finding the requested story";
			}
			if (r.error && r.error.type && r.error.type === "OAuthException") {
				if (this.ontokenexpired) {
					this.ontokenexpired();
				}
				return true;
			}
		} catch (ignore) {
		}
	}
	return false;

};

/**
 * Get date from request.
 * @returns parsed JSON. Null if token is expired
 */
VKClient.prototype.getResultFromRequest = function(request) {
	var res = null;
	if (request.request.readyState === 4 && request.request.status === 200) {
		res = JSON.parse(request.request.responseText);
		if (res.error) {
			
			this.onerror(res.error);
			return null;
		}
		return res;
	}
	if (this.checkTokenExpired(request) === "(#100) Error finding the requested story") {
		return "(#100) Error finding the requested story";
	}
	if (this.checkTokenExpired(request) === true) {
		alert('expired');
		return null;
	}
};