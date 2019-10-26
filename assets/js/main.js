var FaceGraph = require('./components/face-graph.js');
var Utilities = require('./utils.js');
var Graphics = require('./graphics.js');

(function () {
	
	document.addEventListener('DOMContentLoaded',function(){

		FaceGraph().init();
	});
	
})();