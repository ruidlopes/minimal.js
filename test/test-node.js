// run with the following command: node test-node.js
var minimal = require("../minimal-node");
var $m = minimal.template("<html><head><title></title><body><p id='content'></p></body></html>");

$m({
	title: "some title",
	content: "some content"
});

console.log($m.html());


var $m2 = minimal.template("<html><head><title></title><body><p id='content2'></p></body></html>");

$m2({
	title: "some title 2",
	content2: "some content2"
});

console.log($m2.html());