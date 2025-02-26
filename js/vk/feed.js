function Feed() {
	var items = [], groups = [], profiles = [], newOffset = null, nextFrom = null;

	Object.defineProperty(this, 'items', {
		get : function() {
			return items;
		}
	});

	Object.defineProperty(this, 'groups', {
		get : function() {
			return groups;
		}
	});

	Object.defineProperty(this, 'profiles', {
		get : function() {
			return profiles;
		}
	});
	
	Object.defineProperty(this, 'newOffest', {
		get : function(){
			return newOffset;
		},
		set : function(val){
			newOffset = val;
		}
	});
	
	Object.defineProperty(this, 'nextFrom', {
		get : function(){
			return nextFrom;
		},
		set : function(val){
			nextFrom = val;
		}
	});
}

Feed.prototype.getItemById = function(id) {
	var item = null, itemId = parseInt(id, 0);

	for (var i = 0; i < this.items.length; i++) {
		item = this.items[i];
		if (item.post_id === itemId) {
			return item;
		}
	}
};

Feed.prototype.getProfileById = function(id) {
	var profile = null, itemId = parseInt(id, 0);

	for (var i = 0; i < this.profiles.length; i++) {
		profile = this.profiles[i];
		if (profile.id === itemId) {
			return profile;
		}
	}
};

Feed.prototype.getGroupById = function(id) {
	var group = null, itemId = parseInt(id, 0);
	for (var i = 0; i < this.groups.length; i++) {
		group = this.groups[i];
		if (group.id === itemId) {
			return group;
		}
	}
};

Feed.prototype.getOwnerById = function(id){
	var abs = Math.abs(id);
	
	if (parseInt(id, 0) < 0) {
		return this.getGroupById(abs);
	}
	return this.getProfileById(abs);
};

Feed.prototype.add = function(feed) {
	var i = 0, it = null;

	if (!feed) {
		return;
	}
	
	this.nextFrom = feed.next_from;
	this.newOffset = feed.new_offset;

	if (feed.items) {
		for (i = 0; i < feed.items.length; i++) {
			it = feed.items[i];
			if (!this.getItemById(it.post_id)) {
				this.items.push(it);
			}
		}
	}

	if (feed.profiles) {
		for (i = 0; i < feed.profiles.length; i++) {
			it = feed.profiles[i];
			if (!this.getProfileById(it.id)) {
				this.profiles.push(it);
			}
		}
	}

	if (feed.groups) {
		for (i = 0; i < feed.groups.length; i++) {
			it = feed.groups[i];
			if (!this.getGroupById(it.id)) {
				this.groups.push(it);
			}
		}
	}
};