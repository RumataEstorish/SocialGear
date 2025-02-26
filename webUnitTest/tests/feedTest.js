/*global Feed*/
QUnit.module("feedTest");

QUnit.test('addFeed test', function(assert){
	var feed = new Feed(), data = { next_from : '1112', new_offset : 'aaa', items : [{post_id : 234}], groups : [], profiles : [{id : 1}] }, 
	data2 = {next_from : '222', new_offset : 'bbb', items : [{post_id : 444}], groups : [{id : 111}], profiles : [{id : 1}]};
	
	feed.add(data);
	assert.strictEqual(feed.items.length, 1);
	assert.strictEqual(feed.items[0], data.items[0]);
	
	assert.strictEqual(feed.profiles.length, 1);
	assert.strictEqual(feed.profiles[0], data.profiles[0]);
	assert.strictEqual(feed.groups.length, 0);
	assert.strictEqual(feed.nextFrom, data.next_from);
	assert.strictEqual(feed.newOffset, data.new_offset);
	
	feed.add(data2);
	
	assert.strictEqual(feed.items.length, 2);
	assert.strictEqual(feed.groups.length, 1);
	assert.strictEqual(feed.groups[0], data2.groups[0]);
	assert.strictEqual(feed.profiles.length, 1);
	assert.strictEqual(feed.profiles[0], data.profiles[0]);
	assert.strictEqual(feed.nextFrom, data2.next_from);
	assert.strictEqual(feed.newOffset, data2.new_offset);
	
});

QUnit.test('getItemById', function(assert){
	var feed = new Feed(), data = { items : [{post_id : 1234 }]};
	
	feed.add(data);
	assert.strictEqual(feed.getItemById(1234), data.items[0]);
	
});

QUnit.test('getProfileById', function(assert){
var feed = new Feed(), data = { items : [{post_id : 1234 }], profiles : [{id : 111}]};
	
	feed.add(data);
	assert.strictEqual(feed.getProfileById(111), data.profiles[0]);
});

QUnit.test('getGroupById', function(assert){
	var feed = new Feed(), data = { items : [{post_id : 1234 }], profiles : [{id : 111}], groups : [{id : 222}]};
		
	feed.add(data);
	assert.strictEqual(feed.getGroupById(222), data.groups[0]);
});

QUnit.test('getOwnerById', function(assert){
	var feed = new Feed(), data = { items : [{post_id : 1234 }], profiles : [{id : 222}], groups : [{id : 222}]};
	
	feed.add(data);
	assert.strictEqual(feed.getOwnerById(-222), data.groups[0]);
	assert.strictEqual(feed.getOwnerById(222), data.profiles[0]);
	
});

