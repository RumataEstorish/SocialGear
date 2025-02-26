/*global VKClient, GearHttp, $, Log, Utils, GearModel*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

VKClient.FEED_COUNT = 100;
VKClient.FEED_COUNT_GEAR_S = 50;

VKClient.prototype.getAttachmentSmallPreview = function(att){
	return this.getAttachmentBySize(att, 'm');
};

VKClient.prototype.getAttachmentLargePreview = function(att){
	return this.getAttachmentBySize(att, 'x');
};

VKClient.prototype.getAttachmentBySize = function(att, size){
	for (var i = 0; i<att.photo.sizes.length; i++){
		if (att.photo.sizes[i].type === size){
			return att.photo.sizes[i].url;
		}
	}
};

/**
 * Получение ленты новостей.
 */
VKClient.prototype.getFeed = function(offset) {
	var self = this, request = new GearHttp(this.sap), res = null,  d = $.Deferred(), count = VKClient.FEED_COUNT;

	if (this.model && Utils.getGearVersion(this.model) === GearModel.GEAR_S){
		count = VKClient.FEED_COUNT_GEAR_S;
	}
	
	if (!offset) {
		request.open("GET", this.apiAddress + "newsfeed.get?" + this.apiVersion + "&access_token=" + this.accessToken + "&count=" + count + "&filters=post");
		this.feed = [];
	} else {
		request.open("GET", this.apiAddress + "newsfeed.get?" + this.apiVersion + "&access_token=" + this.accessToken + "&count=" + count + "&start_from=" + this.feed.nextFrom + "&filters=post");
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
		
		self.feed.add(res.response);
		d.resolve(self.feed);		
	};

	this.requestQueue.add(request, null);
	//request.send(null);
	return d.promise();
};



VKClient.prototype.getFeedItemText = function(item) {

	if (!item) {
		return '';
	}
	var text = item.text;
	// noinspection JSUnresolvedVariable
	if ((!text || text === '') && item.copy_history) {
		return item.copy_history[0].text;
	}
	if (!text) {
		return '';
	}
	return text;
};

/**
 * Get all attachments from record with one search. Include forwarding
 * 
 * @param item - record in feed where we should get attachments from
 * @returns {Array} attachments array
 */
VKClient.prototype.getFeedItemAttachments = function(item) {
	var att = [], i = 0, j = 0;

	if (item.attachments) {
		for (i = 0; i < item.attachments.length; i++) {
			att.push(item.attachments[i]);
		}
	}

	// noinspection JSUnresolvedVariable
	if (item.copy_history) {
		for (i = 0; i < item.copy_history.length; i++) {
			if (item.copy_history[i].attachments) {
				for (j = 0; j < item.copy_history[i].attachments.length; j++) {
					att.push(item.copy_history[i].attachments[j]);
				}
			}
		}
	}
	return att;
};