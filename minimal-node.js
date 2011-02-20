var jsdom = require("jsdom").jsdom;
	
exports.template = function(template) {
	document = jsdom(template);
	window   = document.createWindow();
		
	var minimal = require("./minimal");

	minimal.$m.html = function() {
		return document.documentElement.innerHTML;
	};
	
	return minimal.$m;
};