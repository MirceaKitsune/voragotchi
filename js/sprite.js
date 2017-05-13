// script 4, sprite.js
// Public Domain / CC0, MirceaKitsune 2016
// contains functions for creating and updating bars and sprites

// common objects
var bar_current = {};
var sprite_current = {};
var sprite_interval = {};
var sprite_delay = {};

// converts a geometry string into style elements
// format: "left top width height z-index"
// note: when the z-index is negative, the element is attached for parallax effect
function get_geometry(string) {
	var box = string ? string.split(" ") : [];
	if (!box[0]) box[0] = "0%";
	if (!box[1]) box[1] = "0%";
	if (!box[2]) box[2] = "100%";
	if (!box[3]) box[3] = "100%";
	if (!box[4]) box[4] = null;
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

// converts actions into a function string
// this lets elements call the scene_action function in scene.js and set scene variables
// if update is true, also execute the scene_interval function immediately
function get_action(action, update) {
	var text = "scene_action(\"" + action.conditional + "\", \"" + action.action + "\"); ";
	text += (update ? "scene_interval(); " : "");
	if (action.delay) {
		// if the delay contains both a name and a number, replace that delay
		var table = action.delay.split(" ") || [];
		var delay_name = table[0];
		var delay_amount = table[1];
		if (delay_name && delay_amount) {
			sprite_delay[delay_name] = sprite_delay[delay_name] || 0;
			text = "sprite_delay[\"" + delay_name + "\"] = setTimeout(function() {" + text + "}, " + (Number(delay_amount) * 1000) + "); ";
			text = "clearTimeout(sprite_delay[\"" + delay_name + "\"]); " + text;
		// if the delay is a single value, set an unnamed delay instead
		} else {
			text = "setTimeout(function() {" + text + "}, " + (Number(action.delay) * 1000) + "); ";
		}
	}
	if (action.probability) {
		text = "if(" + action.probability + " >= Math.random()) {" + text + "}";
	}
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

// sets the bar of a number variable
function bar_set(id, bar, value, parent, bar_def) {
	// if the element doesn't exist, create it
	var element = document.getElementById(id);
	if (!bar || !bar_def || !bar_def[bar]) {
		element && element.remove();
		delete bar_current[id];
		return;
	// if a sprite is not defined, erase the element
	} else if (!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		delete bar_current[id];
	}

	var bar_new = bar_def[bar];
	bar_current[id] = bar_current[id] || {};

	// if the bar or value changed, set the new bar and value
	if (bar_current[id].bar != bar || bar_current[id].value != value) {
		// configure the visuals of this bar
		if (bar_new.layer) {
			var style = get_geometry(bar_new.layer.geometry);
			if (value <= 0) {
				style += "background-color: " + bar_new.layer.color2 + "; ";
			} else if (value >= 1) {
				style += "background-color: " + bar_new.layer.color1 + "; ";
			} else {
				style += "background-image: " + get_gradient(
					bar_new.layer.color1,
					bar_new.layer.color2,
					bar_new.layer.direction,
					(value * 100)
				);
			}

			if (bar_new.layer.alpha) {
				style += "opacity: " + bar_new.layer.alpha + "; ";
			}
			if (bar_new.layer.shape) {
				style += "border-radius: " + bar_new.layer.shape + "; ";
			}
		}

		// configure the text of this bar
		if (bar_new.text) {
			style += "text-align: center; font-weight: bold; ";
			if (bar_new.text.size) {
				style += "font-size: " + bar_new.text.size + "; ";
			}
			if (bar_new.text.color) {
				style += "color: " + bar_new.text.color + "; ";
			}

			var prefix = bar_new.text.content_prefix || "";
			var suffix = bar_new.text.content_suffix || "";
			var value_multiplier = bar_new.text.content_multiplier;
			var value_text = value_multiplier ? Math.floor(value * value_multiplier) : value.toFixed(2);
			var text = prefix + value_text + suffix;
			element.innerText = text;
		}

		element.setAttribute("style", style);
		bar_current[id].bar = bar;
		bar_current[id].value = value;
	}

	// if the parent changed, set the new parent
	if (bar_current[id].parent != parent) {
		var element_parent = document.getElementById(parent);
		if (element_parent) {
			element_parent.appendChild(element);
		} else {
			canvas.appendChild(element);
		}
		bar_current[id].parent = parent;
	}
}

// sets the sprite of an element
function sprite_set(id, sprite, parent, sprite_def) {
	// if the element doesn't exist, create it
	var element = document.getElementById(id);
	if (!sprite || !sprite_def || !sprite_def[sprite]) {
		element && element.remove();
		delete sprite_current[id];
		return;
	// if a sprite is not defined, erase the element
	} else if (!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		delete sprite_current[id];
	}

	var sprite_new = sprite_def[sprite];
	sprite_current[id] = sprite_current[id] || {};

	// if the sprite changed, set the layers from the new sprite
	if (sprite_current[id].sprite != sprite) {
		element.innerHTML = "";
		sprite_interval[id] = null;

		for (var x = 0; x < sprite_new.length; x++) {
			var layer_new = sprite_new[x];
			var element_layer = document.createElement("div");
			element.appendChild(element_layer);

			// configure the visuals of this layer
			if (layer_new.layer) {
				var style = get_geometry(layer_new.layer.geometry);
				if (layer_new.layer.color) {
					style += "background-color: " + layer_new.layer.color + "; ";
				}
				if (layer_new.layer.image) {
					style += "background-image:" + layer_new.layer.image + "; ";
				}
				if (layer_new.layer.alpha) {
					style += "opacity: " + layer_new.layer.alpha + "; ";
				}
				if (layer_new.layer.shape) {
					style += "border-radius: " + layer_new.layer.shape + "; ";
				}
			}

			// configure the text of this layer
			if (layer_new.text) {
				style += "text-align: center; font-weight: bold; ";
				if (layer_new.text.size) {
					style += "font-size: " + layer_new.text.size + "; ";
				}
				if (layer_new.text.color) {
					style += "color: " + layer_new.text.color + "; ";
				}

				var text = layer_new.text.content;
				if (typeof text == "object") {
					var index = Math.floor(Math.random() * text.length);
					text = text[index];
				}
				element_layer.innerText = text;
			}

			// configure the actions of this layer
			if (layer_new.actions) {
				var actions = {};
				for(var action in layer_new.actions) {
					var action_new = layer_new.actions[action];
					var type = action_new.trigger;
					var string = get_action(action_new, (type == "click" || type == "hover_start" || type == "hover_end"));
					actions[type] = actions[type] ? actions[type] + string : string;
				}
				element_layer.setAttribute("onclick", actions["click"]);
				element_layer.setAttribute("onmouseover", actions["hover_start"]);
				element_layer.setAttribute("onmouseout", actions["hover_end"]);
				eval(actions["load"]);
				sprite_interval[id] = sprite_interval[id] ? sprite_interval[id] + actions["interval"] : actions["interval"];

				style += "pointer-events: all; ";
			} else {
				style += "pointer-events: none; ";
			}

			element_layer.setAttribute("style", style);
			sprite_current[id].sprite = sprite;
		}
	}

	// if the parent changed, set the new parent
	if (sprite_current[id].parent != parent) {
		var element_parent = document.getElementById(parent);
		if (element_parent) {
			element_parent.appendChild(element);
		} else {
			canvas.appendChild(element);
		}
		sprite_current[id].parent = parent;
	}
}
