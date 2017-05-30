// script 4, sprite.js
// Public Domain / CC0, MirceaKitsune 2016
// contains functions for creating and updating sprites

// common objects
var sprite_parent_distance = {};
var sprite_current = {};
var sprite_variable = {};
var sprite_action = {};
var sprite_delay = {};

// returns the distance of a geometry string, based on the z-index
function get_geometry_distance(string) {
	var box = string ? string.split(" ") : [];
	var distance = box[4] ? Number(box[4]) : 0;
	if(distance >= 0) {
		// normal falloff
		distance = 1 + distance;
	} else {
		// reverse falloff
		distance = 1 / (1 + Math.abs(distance));
	}
	return distance;
}

// converts a geometry string into style elements
// format: "left top width height z-index"
// note: when the z-index is negative, the element is attached for parallax effect
function get_geometry(string) {
	var box = string ? string.split(" ") : [];
	if(!box[0]) box[0] = "0%";
	if(!box[1]) box[1] = "0%";
	if(!box[2]) box[2] = "100%";
	if(!box[3]) box[3] = "100%";
	if(!box[4]) box[4] = null;
	var text =
		"position: absolute; " +
		"left: " + box[0] + "; " +
		"top: " + box[1] + "; " +
		"width: " + box[2] + "; " +
		"height: " + box[3] + "; " +
		"z-index: " + (box[4] ? box[4] : "auto") + "; " +
		"background-attachment: " + (box[4] < 0 ? "fixed" : "scroll") + "; " +
		"background-size: 100% 100%; ";
	return text;
}

// converts two colors and a percentage into a gradient
function get_gradient(color1, color2, direction, blend) {
	var text = "linear-gradient(" +
	"to " + direction + ", " +
	color1 + ", " +
	color1 + " " + blend + "%, " +
	color2 + " " + blend + "%, " +
	color2 + "); ";
	return text;
}

// replaces variable names with their values in a text field
function text_replace(text) {
	var table_all = text.split(/[^a-zA-Z0-9$_]+/); // anything that's not: a-z,A-Z,0-9,$,_
	for(var entry_all in table_all) {
		// table[1] is the variable name, table[2] is the optional visual multiplier
		var table = table_all[entry_all].split("$");
		if(typeof table[1] === "string" && table[1] !== "") {
			var value = scene_action_get("$" + table[1]);
			if(Number(value) !== NaN && Number(value) > 0) {
				value = Number(value);

				var multiplier = Number(table[2]);
				if(multiplier !== NaN && multiplier > 0) {
					value = value * multiplier;
					value = Math.floor(value) // treat as integer
				} else {
					value = value.toFixed(2); // treat as float, 2 decimals
				}
			}
			text = text.replace(table_all[entry_all], value);
		}
	}
	return text;
}

// sets the sprite of an element
function sprite_set(id, sprite, parent, sprite_def) {
	var element_parent = document.getElementById(parent);
	if(!element_parent)
		return;

	// if the element doesn't exist, create it
	// if a sprite is not defined, erase the element instead
	var element = document.getElementById(id);
	if(!sprite || !sprite_def || !sprite_def[sprite]) {
		element && element.remove();
		delete sprite_current[id];
		return;
	} else if(!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		element_parent.appendChild(element);
		delete sprite_current[id];
	}

	// decide whether to update the sprite, based on whether the sprite has changed or any tracked variable has been modified
	var update = false;
	if(sprite_current[id] !== sprite) {
		update = true;
	} else {
		for(var variable in sprite_variable[id]) {
			if(scene_data.variables[variable] !== null && scene_data.variables[variable] !== undefined) {
				var value1 = sprite_variable[id][variable];
				var value2 = scene_data.variables[variable];
				if(value1 !== value2) {
					update = true;
					break;
				}
			}
		}
	}

	// if we decided to update the sprite, set the layers from the new sprite
	if(update) {
		element.innerHTML = "";
		sprite_variable[id] = {};

		// delete all sprite actions associated with this sprite
		for(var entry in sprite_action) {
			if(entry.substring(0, id.length) === id)
				delete sprite_action[entry];
		}

		// begin looping through the layers of the new sprite
		var sprite_new = sprite_def[sprite];
		for(var layer in sprite_new) {
			var style = "";
			var style_pointer = false;
			var layer_new = sprite_new[layer];
			var layer_element = document.createElement("div");
			element.appendChild(layer_element);

			// configure the geometries of all specified mods
			for(var mod in layer_new.geometries) {
				var index = Math.floor(Math.random() * layer_new.geometries[mod].length);
				var geometry = layer_new.geometries[mod][index];

				// set the geometry of the mod's element to the new geometry
				var mod_element = document.getElementById(mod);
				if(mod_element)
					mod_element.setAttribute("style", get_geometry(geometry));

				// set the distance of this mod for use by child sprites
				sprite_parent_distance[mod] = get_geometry_distance(geometry);
			}

			// configure the visuals of this layer
			if(layer_new.layer) {
				style += get_geometry(layer_new.layer.geometry);

				// choose whether to draw a gradient image, or a normal background color plus image
				if(layer_new.layer.gradient) {
					var color1 = (layer_new.layer.gradient.color1 !== null && layer_new.layer.gradient.color1 !== undefined) ? layer_new.layer.gradient.color1 : "#ffffff";
					var color2 = (layer_new.layer.gradient.color2 !== null && layer_new.layer.gradient.color2 !== undefined) ? layer_new.layer.gradient.color2 : "#000000";
					var direction = (layer_new.layer.gradient.direction !== null && layer_new.layer.gradient.direction !== undefined) ? layer_new.layer.gradient.direction : "right";
					var value_name = layer_new.layer.gradient.value.substring(1);
					var value = layer_new.layer.gradient.value;
					if(scene_data.variables[value_name] !== null && scene_data.variables[value_name] !== undefined) {
						value = scene_data.variables[value_name];
						sprite_variable[id][value_name] = value; // track this variable
					}

					if(value <= 0)
						style += "background-color: " + color2 + "; ";
					else if(value >= 1)
						style += "background-color: " + color1 + "; ";
					else
						style += "background-image: " + get_gradient(color1, color2, direction, (value * 100));
				} else {
					if(layer_new.layer.color)
						style += "background-color: " + layer_new.layer.color + "; ";
					if(layer_new.layer.image)
						style += "background-image:" + layer_new.layer.image + "; ";
				}
				if(layer_new.layer.alpha)
					style += "opacity: " + layer_new.layer.alpha + "; ";
				if(layer_new.layer.shape)
					style += "border-radius: " + layer_new.layer.shape + "; ";
				if(layer_new.layer.cursor) {
					style += "cursor: " + layer_new.layer.cursor + "; ";
					style_pointer = true;
				}
			}

			// configure the text of this layer
			if(layer_new.text) {
				if(layer_new.text.align)
					style += "text-align: " + layer_new.text.align + "; ";
				if(layer_new.text.size)
					style += "font-size: " + layer_new.text.size + "; ";
				if(layer_new.text.weight)
					style += "font-weight: " + layer_new.text.weight + "; ";
				if(layer_new.text.family)
					style += "font-family: " + layer_new.text.family + "; ";
				if(layer_new.text.color)
					style += "color: " + layer_new.text.color + "; ";

				var text = layer_new.text.content;
				if(typeof text === "object") {
					var index = Math.floor(Math.random() * text.length);
					text = text[index];
				}
				layer_element.innerText = text_replace(text);
			}

			// configure the audio of this layer
			if(layer_new.audio) {
				var audio_id = (layer_new.audio.id !== undefined) ? layer_new.audio.id : "audio";
				var audio_element = document.getElementById(audio_id);
				if(!audio_element) {
					audio_element = document.createElement("audio");
					audio_element.setAttribute("id", audio_id);
					canvas.appendChild(audio_element);
				}

				audio_element.setAttribute("src", layer_new.audio.sound);
				audio_element.setAttribute("volume", layer_new.audio.volume); // set later
				if(layer_new.audio.loop === "true")
					audio_element.setAttribute("loop", true);
				audio_element.setAttribute("autoplay", true);

				// set the volume based on distance
				var distance = (layer_new.audio.distance && sprite_parent_distance[parent]) ? Math.pow(sprite_parent_distance[parent], layer_new.audio.distance) : 1;
				audio_element.volume = Math.min(Number(layer_new.audio.volume) * distance, 1);
			}

			// configure the actions of this layer
			if(layer_new.actions) {
				var func_click = "";
				var func_hover_start = "";
				var func_hover_end = "";
				var func_load = [];
				var func_interval = [];

				for(var action in layer_new.actions) {
					var action_new = layer_new.actions[action];
					var action_id = id + "_" + layer + "_" + action;

					if(sprite_delay[action_id])
						clearTimeout(sprite_delay[action_id]);
					delete sprite_delay[action_id];

					sprite_action[action_id] = action_new;
					switch(action_new.trigger) {
						case "click":
							func_click += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "hover_start":
							func_hover_start += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "hover_end":
							func_hover_end += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "load":
							func_load.push(action_id);
							break;
						case "interval":
							func_interval.push(action_id);
							break;
						default:
							break;
					}
				}

				if(func_click !== "")
					layer_element.setAttribute("onclick", func_click);
				if(func_hover_start !== "")
					layer_element.setAttribute("onmouseover", func_hover_start);
				if(func_hover_end !== "")
					layer_element.setAttribute("onmouseout", func_hover_end);
				for(var func_load_action in func_load)
					scene_action(func_load[func_load_action], false, false);
				for(var func_interval_action in func_interval)
					scene_action(func_interval[func_interval_action], false, false);
			}

			style += style_pointer ? "pointer-events: all; " : "pointer-events: none; ";
			layer_element.setAttribute("style", style);
			sprite_current[id] = sprite;
		}
	}
}
