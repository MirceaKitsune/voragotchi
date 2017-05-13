// script 5, scene.js
// Public Domain / CC0, MirceaKitsune 2016
// creates and manages the scene

// scene objects
var scene_data = null;
var scene_interval_timer = null;

// handler for sprite actions
// this function is called by sprites, as defined in sprite.js
// if a conditional string is defined, evaluate it
function scene_action(conditional, action) {
	if (typeof conditional == "string" && conditional != "undefined") {
		//check the conditional
		var table = conditional.split(" ") || [];
		var prop = scene_data.variables[table[0]];
		var type = table[1];
		var val = table[2];
		if ((typeof prop != "number" && typeof prop != "string") || !type || !val) {
			// the conditional is invalid, ignore it and move on
		} else if (type == "==" && (prop == Number(val) || prop == val)) {
			// property is equal, move on
		} else if (type == "!=" && (prop != Number(val) && prop != val)) {
			// property is not equal, move on
		} else if (type == "<" && prop < Number(val)) {
			// property is lesser, move on
		} else if (type == "<=" && prop <= Number(val)) {
			// property is lesser or equal, move on
		} else if (type == ">" && prop > Number(val)) {
			// property is greater, move on
		} else if (type == ">=" && prop >= Number(val)) {
			// property is greater or equal, move on
		} else {
			return;
		}
	}

	if (typeof action == "string" && action != "undefined") {
		// execute the action
		var table = action.split(" ") || [];
		var prop = scene_data.variables[table[0]];
		var type = table[1];
		var val = table[2];
		if (!type || !val) {
			// delete the value
			delete scene_data.variables[table[0]];
		} else if (type == "=") {
			// the action is set
			if (typeof prop == "number") {
				scene_data.variables[table[0]] = Number(val);
			} else {
				scene_data.variables[table[0]] = val;
			}
		} else if (type == "+=") {
			// the action is add
			if (typeof prop == "number") {
				scene_data.variables[table[0]] += Number(val);
			}
		} else if (type == "-=") {
			// the action is subtract
			if (typeof prop == "number") {
				scene_data.variables[table[0]] -= Number(val);
			}
		} else if (type == "*=") {
			// the action is multiply
			if (typeof prop == "number") {
				scene_data.variables[table[0]] *= Number(val);
			}
		} else if (type == "/=") {
			// the action is divide
			if (typeof prop == "number") {
				scene_data.variables[table[0]] /= Number(val);
			}
		} else {
			return;
		}
	}
}

// interval function of the scene, variables
// ran by the scene_interval function, calculates changes in variables based on the given rule set
function scene_interval_variables(rules, seconds) {
	for(var rule in rules) {
		// if there's a per second rule, add it to the offset
		var offset = 0;
		if (rules[rule].per_second) {
			offset += Number(rules[rule].per_second);
		}

		// if there's a for variable rule, add or subtract this variable in the offset
		for(var variable in scene_data.variables) {
			var amount = Number(rules[rule]["for_" + variable]);
			if (amount) {
				offset += (-1 + scene_data.variables[variable] * 2) * amount;
			}
		}

		// initiate this variable if it doesn't exist, then apply the offset and bounds
		if (typeof scene_data.variables[rule] != "number") {
			scene_data.variables[rule] = Number(rules[rule].value);
		}
		var min = Number(rules[rule].value_min) || 0;
		var max = Number(rules[rule].value_max) || 1;
		scene_data.variables[rule] += offset * seconds;
		scene_data.variables[rule] = Math.min(Math.max(scene_data.variables[rule], min), max);
	}
}

// interval function of the scene
// executes every 1 second, updates variables bars and sprites
function scene_interval() {
	var date = new Date();
	var date_time = date.getTime();
	var date_hours = date.getHours();
	var date_minutes = date.getMinutes();
	var date_seconds = date.getSeconds();

	// get the amount of time that passed since this function last executed
	var last = date_time - scene_data.variables.time_last;
	var last_seconds = Math.floor(last / 1000);
	if (last_seconds > 0) {
		scene_data.variables.time_last = date_time;
	}

	// get the amount of time that passed since this world was created
	var pass = scene_data.variables.time_last - scene_data.variables.time_start;
	var pass_seconds = Math.floor(pass / 1000);
	var pass_minutes = Math.floor(pass_seconds / 60);
	var pass_hours = Math.floor(pass_minutes / 60);
	var pass_days = Math.floor(pass_hours / 24);

	// execute the interval function strings of sprites
	for (var sprite in sprite_interval) {
		if (sprite_interval[sprite]) {
			var on_interval = sprite_interval[sprite];
			eval(on_interval);
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
			if (typeof scene_data.variables["sprite_" + sprite] == "string") {
				name = scene_data.variables["sprite_" + sprite];
			}
			sprite_set("sprite_" + sprite, name, item, scene_data.data_sprites);
		}

		// update bars
		for(var variable in scene_data.variables) {
			if (mod.variables && mod.variables[variable] && mod.variables[variable].bar) {
				var bar = mod.variables[variable].bar;
				if (typeof scene_data.variables["bar_" + variable] == "string") {
					bar = scene_data.variables["bar_" + variable];
				}
				bar_set("bar_" + variable, bar, scene_data.variables[variable], item, scene_data.data_bars);
			}
		}
	}

	// update data
	// note: dates are also unset then updated here, as they're not meant to be stored
	delete scene_data.variables.date_hours;
	delete scene_data.variables.date_minutes;
	delete scene_data.variables.date_seconds;
	data_field_set("variables", scene_data.variables);
	scene_data.variables.date_hours = date_hours;
	scene_data.variables.date_minutes = date_minutes;
	scene_data.variables.date_seconds = date_seconds;

	// temporarily force daytime for easier development
	//scene_data.variables.date_hours = 16;
}

// unload the scene
function scene_unload() {
	clearInterval(scene_interval_timer);
	scene_data = null;
	canvas.innerHTML = "";
}

// load the scene
function scene_load() {
	var date = new Date();
	var date_time = date.getTime();
	scene_unload();
	scene_data = {};

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
	// if this is a new world, initiate it with the start and last timers
	scene_data.variables = data_field_get("variables") || {
		time_start: date_time,
		time_last: date_time
	};

	// configure the geometries of mods
	for (var item in scene_data) {
		if (item.substring(0, 5) == "mods_" && scene_data[item].geometries) {
			for (var geometry in scene_data[item].geometries) {
				var element = document.getElementById(geometry);
				if (element) {
					var index = Math.floor(Math.random() * scene_data[item].geometries[geometry].length);
					var geometry = get_geometry(scene_data[item].geometries[geometry][index]);
					element.setAttribute("style", geometry);
				}
			}
		}
	}

	// run the inverval function
	scene_interval();
	scene_interval_timer = setInterval(scene_interval, 100); // 1000 = 1 second
}

// if data exists, initiate the scene
// if no data exists, the mod menu will be loaded in mod.js instead
if (data) {
	scene_load();
}
