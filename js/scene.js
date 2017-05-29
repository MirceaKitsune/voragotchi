// script 5, scene.js
// Public Domain / CC0, MirceaKitsune 2016
// creates and manages the scene

// scene objects
var scene_data = null;
var scene_interval_timer = null;
var scene_preload_assets = null;

// reads the given variable for a scene action
// if the name starts with $ it represents a variable, otherwise it represent a sprite, if not then it represents a simple string
function scene_action_get(name) {
	if (typeof name != "string") return name;

	// check if this is a special variable, and return its value if so
	switch (name) {
		case "$random":
			return Math.random();
		case "$date_hours":
			var date = new Date();
			var date_time = date.getTime();
			return date.getHours();
		case "$date_minutes":
			var date = new Date();
			var date_time = date.getTime();
			return date.getMinutes();
		case "$date_seconds":
			var date = new Date();
			var date_time = date.getTime();
			return date.getSeconds();
		case "$info_browser_name":
			return navigator.appName;
		case "$info_browser_codename":
			return navigator.appCodeName;
		case "$info_browser_engine":
			return navigator.product;
		case "$info_browser_version":
			return navigator.appVersion;
		case "$info_platform":
			return navigator.platform;
		case "$info_language":
			return navigator.language;
		case "$info_online":
			return navigator.onLine;
		case "$info_cookies":
			return navigator.cookieEnabled;
		default:
			break;
	}

	if (name.substring(0, 1) == "$") {
		if (scene_data.variables[name.substring(1)] != null && scene_data.variables[name.substring(1)] != "undefined") {
			return scene_data.variables[name.substring(1)];
		}
	} else {
		if (scene_data.sprites[name] != null && scene_data.sprites[name] != "undefined") {
			return scene_data.sprites[name];
		}
	}
	return name;
}

// writes the given variable for a scene action
// if the name starts with $ it represents a variable, otherwise it represent a sprite
function scene_action_set(name, value) {
	if (typeof name != "string") return;

	// check if this is a potential variable or sprite, and use its value if so
	value = scene_action_get(value);

	if (name.substring(0, 1) == "$") {
		if (value == null) {
			delete scene_data.variables[name.substring(1)];
		} else {
			scene_data.variables[name.substring(1)] = value;
		}
	} else {
		if (value == null) {
			delete scene_data.sprites[name];
		} else {
			scene_data.sprites[name] = value;
		}
	}
}

// handler for sprite actions
// this function is called by sprites, as defined in sprite.js
// id is the name of the action, update applies a forced update to the scene, delayed is used to check whether a delay was applied
function scene_action(id, update, delayed) {
	var action = sprite_action[id];
	if (typeof action != "object") {
		return;
	}

	// if this action has a delay, clear the existing delay if any, then reschedule it for later
	if (action.delay && !delayed) {
		if (sprite_delay[id] != null && sprite_delay[id] != "undefined") {
			clearTimeout(sprite_delay[id]);
		}
		sprite_delay[id] = setTimeout(function() { scene_action(id, true, true) }, Number(action.delay) * 1000);
		return;
	}

	// verify the conditionals
	// first separate by logical OR, then separate by logical AND, then evaluate each condition
	if (typeof action.conditional == "string" && action.conditional != "undefined") {
		var passed = false;
		var table_or = action.conditional.split(" || ");
		for(var entry_or in table_or) {
			passed = true;
			var table_and = table_or[entry_or].split(" && ");
			for(var entry_and in table_and) {
				var table = table_and[entry_and].split(" ");
				var type = table[1];
				var val1 = scene_action_get(table[0]);
				var val2 = scene_action_get(table[2]);
				if ((typeof val1 != "number" && typeof val1 != "string") || !type || !val2) {
					// the conditional is invalid, ignore it and move on
				} else if (type == "==" && (val1 == val2 || Number(val1) == Number(val2))) {
					// property is equal, move on
				} else if (type == "!=" && (val1 != val2 && Number(val1) != Number(val2))) {
					// property is not equal, move on
				} else if (type == "<" && Number(val1) < Number(val2)) {
					// property is lesser, move on
				} else if (type == "<=" && Number(val1) <= Number(val2)) {
					// property is lesser or equal, move on
				} else if (type == ">" && Number(val1) > Number(val2)) {
					// property is greater, move on
				} else if (type == ">=" && Number(val1) >= Number(val2)) {
					// property is greater or equal, move on
				} else {
					// the conditional didn't pass, stop here
					passed = false;
					break;
				}
			}
			if (passed) {
				break;
			}
		}
		if (!passed) {
			return;
		}
	}

	// execute the actions
	if (typeof action.action == "string" && action.action != "undefined") {
		var table_all = action.action.split(";");
		for(var entry_all in table_all) {
			var table = table_all[entry_all].split(" ");
			var type = table[1];
			var prop = scene_action_get(table[0]);
			var val = scene_action_get(table[2]);
			if (!type || !val) {
				// delete the value
				scene_action_set(table[0], null);
			} else if (type == "=") {
				// the action is set
				if (typeof prop == "number") {
					scene_action_set(table[0], Number(val));
				} else {
					scene_action_set(table[0], val);
				}
			} else if (type == "+=") {
				// the action is add
				if (typeof prop == "number") {
					scene_action_set(table[0], prop + Number(val));
				}
			} else if (type == "-=") {
				// the action is subtract
				if (typeof prop == "number") {
					scene_action_set(table[0], prop - Number(val));
				}
			} else if (type == "*=") {
				// the action is multiply
				if (typeof prop == "number") {
					scene_action_set(table[0], prop * Number(val));
				}
			} else if (type == "/=") {
				// the action is divide
				if (typeof prop == "number") {
					scene_action_set(table[0], prop / Number(val));
				}
			}
		}
	}

	// immediately update the scene for certain types of actions
	if (update) {
		scene_interval();
	}
}

// interval function of the scene, variables
// ran by the scene_interval function, calculates changes in variables based on the given rule set
function scene_interval_variables(rules, seconds) {
	for(var rule in rules) {
		var offset = 0;

		// if there's a per second rule, add it to the offset
		if (rules[rule].per_second) {
			offset += Number(rules[rule].per_second);
		}

		// if there's a for variable rule, add or subtract this variable in the offset
		for(var variable in rules[rule].per_variable) {
			var name = variable.substring(1);
			var value = Number(rules[rule].per_variable[variable]);
			if (scene_data.variables[name] != null && scene_data.variables[name] != "undefined") {
				offset += (-1 + scene_data.variables[name] * 2) * value;
			}
		}

		// multiply the offset based on the speed setting
		offset *= scene_data.variables.game_speed;

		// initiate this variable if it doesn't exist, then apply the offset and bounds
		if (typeof scene_data.variables[rule] != "number") {
			scene_data.variables[rule] = Number(scene_action_get(rules[rule].value));
		}
		var min = Number(rules[rule].value_min) || 0;
		var max = Number(rules[rule].value_max) || 1;
		scene_data.variables[rule] += offset * seconds;
		scene_data.variables[rule] = Math.min(Math.max(scene_data.variables[rule], min), max);
	}
}

// interval function of the scene
// executes every 1 second, updates variables and sprites
function scene_interval() {
	if (scene_preload()) return;

	// get the amount of time that passed since this function last executed
	var date = new Date();
	var date_time = date.getTime();
	var last = date_time - scene_data.variables.time_last;
	var last_seconds = Math.floor(last / 1000);
	if (last_seconds > 0) {
		scene_data.variables.time_last = date_time;
	}

	// execute the interval functions of sprites
	for (var entry in sprite_action) {
		var action = sprite_action[entry];
		if (action.trigger == "interval") {
			scene_action(entry, false, false);
		}
	}

	// mod specific updates
	for (var item in scene_data) {
		if (item.substring(0, 5) != "mods_") continue;
		var mod = scene_data[item];

		// update numeric variables
		scene_interval_variables(mod.variables, last_seconds);

		// update sprites
		for(var sprite in mod.sprites) {
			var name = mod.sprites[sprite];
			if (typeof scene_data.sprites[sprite] == "string") {
				name = scene_data.sprites[sprite];
			}
			sprite_set("sprite_" + sprite, name, item, scene_data.data_sprites);
		}
	}

	// update data
	data_field_set("variables", scene_data.variables);
}

// scene preload, skip button
function scene_preload_button_skip() {
	scene_preload_assets = null;
	scene_preload();
}

// handles the preloading of assets, ensuring the browser has them before the scene is actually drawn
// if assets are still loading, the preload screen is shown and the function returns true, otherwise the function returns false
function scene_preload() {
	element = document.getElementById("preload");

	// check if there are any assets to verify, null means we've already checked
	if (scene_preload_assets == null) {
		element && element.remove();
		return false;
	}

	// note all assets that may be used in this scene
	var images = [];
	var sounds = [];
	for (var item1 in scene_data) {
		if (item1.substring(0, 5) != "data_") continue;
		var object = scene_data[item1];
		for (var item2 in object) {
			var sprite = object[item2];
			for (var item3 in sprite) {
				var layer = sprite[item3];
				if (layer && layer.layer && layer.layer.image) {
					images.push(layer.layer.image);
				}
				if (layer && layer.audio && layer.audio.sound) {
					sounds.push(layer.audio.sound);
				}
			}
		}
	}
	var assets_total = images.length + sounds.length;

	// check if each asset has loaded, if the number of reports matches the number of assets then it has
	if (assets_total == scene_preload_assets) {
		element && element.remove();
		scene_preload_assets = null;
		return false;
	}

	// if the element hasn't been created, prepare it and reset existing reports
	// each element reports to the code when it finishes loading, via its load event adding 1 to the scene_preload_assets variable
	if (!element) {
		// configure the HTML element of the preloader
		scene_preload_assets = 0;
		element = document.createElement("div");
		element.setAttribute("id", "preload");
		element.setAttribute("style", "position: absolute; top: 45%; left: 0%; width: 100%; height: 10%; background-color: #c0c0c0; text-align: center; z-index: 9999");
		canvas.appendChild(element);

		// preloader HTML: label
		element_label = document.createElement("label");
		element_label.setAttribute("id", "preload_label");
		element_label.setAttribute("style", "position: absolute; top: 0%; left: 0%; width: 100%; height: 25%");
		element_label.innerText = "Checking and preloading assets...";
		element.appendChild(element_label);

		// preloader HTML: button (skip)
		element_button_skip = document.createElement("button");
		element_button_skip.setAttribute("id", "preload_button_skip");
		element_button_skip.setAttribute("style", "position: absolute; top: 25%; left: 45%; width: 10%; height: 25%");
		element_button_skip.setAttribute("onclick", "scene_preload_button_skip()");
		element_button_skip.innerText = "Skip";
		element.appendChild(element_button_skip);

		// preloader HTML: sprites
		var size = Math.min((1 / images.length) * 100, 2.5); // in %
		for (var i = 0; i < images.length; i++) {
			var name = images[i].split(/[()]+/)[1]; // image name in between "url(" and ")"
			element_sprite = document.createElement("img");
			element_sprite.setAttribute("src", name);
			element_sprite.setAttribute("style", "position: absolute; top: 50%; left: " + (size * i) + "%; width: " + size + "%; height: 50%");
			element_sprite.setAttribute("onload", "++scene_preload_assets");
			element.appendChild(element_sprite);
		}

		// preloader HTML: audios
		for (var i = 0; i < sounds.length; i++) {
			var name = sounds[i];
			element_audio = document.createElement("audio");
			element_audio.setAttribute("src", name);
			element_audio.setAttribute("oncanplaythrough", "++scene_preload_assets");
			element.appendChild(element_audio);
		}
	}

	// update asset count on the label element
	element_label = document.getElementById("preload_label");
	if (element_label) {
		element_label.innerText = "Checking and preloading assets: " + scene_preload_assets + " / " + assets_total + " (" + images.length + " images, " + sounds.length + " sounds)";
	}

	return true;
}

// unload the scene
function scene_unload() {
	clearInterval(scene_interval_timer);
	scene_data = null;
	scene_preload_assets = 0;
	canvas.innerHTML = "";

	// set the page title
	document.title = "Loading...";
}

// load the scene
function scene_load() {
	scene_unload();
	scene_data = {};
	scene_preload_assets = 0;
	canvas.innerHTML = "";

	// load the objects of the scene from json files, using the fields stored in the data
	var files = data_field_get("files");
	var mods = data_field_get("mods");
	for(var i = 0; i < files.length; i++) {
		var file = get_json(files[i]);
		for (var item in file) {
			// if this is a mod, use the selected object
			if (mods[item]) {
				var name = mods[item];
				scene_data[item] = file[item][name];

				// configure the mod's element
				var element = document.getElementById(item);
				if (!element) {
					element = document.createElement("div");
					element.setAttribute("id", item);
					element.setAttribute("style", "position: absolute; top: 0%; left: 0%; width: 100%; height: 100%");
					canvas.appendChild(element);
				}
			// if this is data, add all objects to an array
			} else {
				scene_data[item] = scene_data[item] || {};
				for (var mod in file[item]) {
					scene_data[item][mod] = file[item][mod];
				}
			}
		}
	}

	// load the variables of the scene from the data
	scene_data.variables = data_field_get("variables");
	scene_data.sprites = {};

	// run the inverval function
	scene_interval();
	scene_interval_timer = setInterval(scene_interval, 100); // 1000 = 1 second

	// set the page title
	document.title = scene_data.variables.game_name + "'s world";
}

// if data exists, initiate the scene
// if no data exists, the mod menu will be loaded in mod.js instead
if (data) {
	scene_load();
}
