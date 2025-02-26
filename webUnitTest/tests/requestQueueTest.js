/*global RequestQueue, GearHttp*/
QUnit.module("requestQueueTest");

QUnit.test('add test', function(assert){
	
	var queue = new RequestQueue(), req1 = new GearHttp(null, false), req2 = new GearHttp(null, false), req3 = new GearHttp(null, false), req4 = new GearHttp(null, false), req5 = new GearHttp(null, false);
	
	req1.open('GET', 'https://fotostrana.ru');
	req2.open('GET', 'https://fotostrana.ru');
	req3.open('GET', 'https://fotostrana.ru');
	req4.open('POST', 'https://fotostrana.ru');
	req5.open('GET', 'http://fotostrana.ru');
	
	queue.add(req1, 'asdf');
	queue.add(req2, 'asdf');
	
	assert.strictEqual(queue.queue.length, 1);
	
	queue.add(req3, 'test');
	assert.strictEqual(queue.queue.length, 2);
	
	queue.add(req4, 'asdf');
	assert.strictEqual(queue.queue.length, 3);
	
	queue.add(req5, 'asdf');
	assert.strictEqual(queue.queue.length, 4);
	
	
});