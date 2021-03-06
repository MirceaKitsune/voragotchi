// script 1, init.js
// Public Domain / CC0, MirceaKitsune 2016
// configures the canvas, contains common builtin functions

// configure the canvas
var canvas = document.createElement("div");
canvas.setAttribute("style", "overflow: auto; position: absolute; top: 0%; left: 0%; width: 100%; height: 100%; pointer-events: none");
document.body.appendChild(canvas);

// returns the contents of a json file
function get_json(url) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", url, false);
	xmlHttp.send(null);
	return JSON.parse(xmlHttp.responseText);
}

// returns the value of location.search from the URL
function get_search(name) {
	var search = location.search.substring(1).split("=");
	if(name === search[0] && search[1] !== "")
		return search[1];
	return null;
}

// returns a random entry if this is an array, or the same value if not
function get_random(object) {
	if(typeof object === "object") {
		var index = Math.floor(Math.random() * object.length);
		return object[index];
	}
	return object;
}
