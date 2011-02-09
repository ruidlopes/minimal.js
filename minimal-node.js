var jsdom = require("jsdom").jsdom;
	
exports.template = function(template) {
	document = jsdom(template);
	window   = document.createWindow();
		
	require("./minimal.js");
		
	var $m = window.$m;
	$m.html = function() {
		return document.documentElement.innerHTML;
	};
	
	return $m;
};