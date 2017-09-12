// script 3, mod.js
// Public Domain / CC0, MirceaKitsune 2016
// configures files and mods, generates the mod management menu

// mod objects
var mods_menu_data_files =
	"data/default_environment.json\n" +
	"data/default_actions.json\n" +
	"data/default_pet.json\n" +
	"data/default_people.json";
var mods_menu_data_mods = {};

// mod management menu, load button
// updates the file list and refreshes the menu
function mods_menu_button_load() {
	var value = document.getElementById("menu_list").value;
	mods_menu_data_files = value;
	mods_menu_add();
}

// mod management menu, start button
// starts a new world with the selected options
function mods_menu_button_start() {
	var date = new Date();
	var date_time = date.getTime();
	var elements = document.forms["menu_form"].elements;

	// prepare mods and variables
	var data_mods = {};
	var data_variables = {
		time_start: date_time,
		time_last: date_time,
		game_name: elements["menu_form_player"].value || "Anonymous",
		game_speed: elements["menu_form_speed"].value || "1"
	};

	// read mods and variables from the menu
	// note: mods must come before variables, as the variable check requires knowing which mods were set
	for(var i = 0; i < elements.length; i++) {
		// store the indexes of the mods we've selected
		if(elements[i].name.substring(0, 5) === "mods_" && elements[i].checked) {
			var name = elements[i].name;
			data_mods[name] = elements[i].value;
		}

		// store the values of the settings variables for the mods we've selected
		// the class attribute always represents the name of a mod if set, so just check if its value exists anywhere in the mods list
		if(Object.values(data_mods).indexOf(elements[i].class) >= 0)
			data_variables[elements[i].name] = elements[i].value;
	}

	// create new data with the selected files and mods
	// note: we rely on the function below refreshing the page to load the scene
	var data_files = mods_menu_data_files.split("\n");
	var data_name = elements["menu_form_name"].value || "default";
	var data_message =
		"Notice: This world will be persisted under the name \"" + data_name + "\". " +
		"Save the new URL to access it, or manually add ?data=" + data_name + " to the end of the URL.";
	data = {files: data_files, mods: data_mods, variables: data_variables};
	data_init(data_name, data_message);
}

// update the page title
function mods_menu_title() {
	var elements = document.forms["menu_form"].elements;
	var name = elements["menu_form_player"].value || "Anonymous";
	document.title = name + "'s world (new)";
}

// remove the mod management menu
function mods_menu_remove() {
	var element = document.getElementById("menu");
	element && element.remove();
	mods_menu_data_files = {};
	mods_menu_data_mods = {};

	// set the page title
	document.title = "Loading...";
}

// add the mod management menu
function mods_menu_add() {
	// load available mods from files
	mods_menu_data_mods = {};
	var files = mods_menu_data_files.split("\n");
	var settings = {};
	for(var i = 0; i < files.length; i++) {
		var file = get_json(files[i]);
		for(var item in file) {
			for(var mod in file[item]) {
				mods_menu_data_mods[item] = mods_menu_data_mods[item] || [];
				mods_menu_data_mods[item].push(mod);

				// persist variables that represent settings
				var variables = file[item][mod].variables;
				for(var variable in variables) {
					if(typeof variables[variable].label === "string") {
						settings[mod] = settings[mod] || {};
						settings[mod][variable] = variables[variable];
					}
				}
			}
		}
	}

	// configure the HTML element of the menu
	var element = document.getElementById("menu");
	if(!element) {
		element = document.createElement("div");
		element.setAttribute("id", "menu");
		element.setAttribute("style", "width: 100%; height: 100%; background-color: #c0c0c0; pointer-events: all");
		canvas.appendChild(element);
	}
	element.innerHTML = "";

	// menu HTML: file list
	var element_textarea = document.createElement("textarea");
	element_textarea.setAttribute("id", "menu_list");
	element_textarea.setAttribute("style", "resize: none; position:absolute; top: 0%; left: 0%; width: 50%; height: 90%");
	element_textarea.innerHTML = mods_menu_data_files;
	element.appendChild(element_textarea);

	// menu HTML: form
	var element_form = document.createElement("form");
	element_form.setAttribute("id", "menu_form");
	element_form.setAttribute("style", "overflow: auto; position:absolute; top: 0%; left: 50%;  width: 50%; height: 90%");
	element.appendChild(element_form);
	{
		// menu HTML: form, name
		var element_form_name = document.createElement("p");
		element_form_name.innerHTML = "<b>data_name:</b> ";
		element_form.appendChild(element_form_name);
		{
			// menu HTML: form, name, input
			var element_form_name_input = document.createElement("input");
			element_form_name_input.setAttribute("id", "menu_form_name");
			element_form_name_input.setAttribute("type", "text");
			element_form_name_input.setAttribute("value", "default");
			element_form_name.appendChild(element_form_name_input);
		}

		// menu HTML: form, mods
		for(var item in mods_menu_data_mods) {
			if(item.substring(0, 5) === "data_") {
				// menu HTML: form, item (data)
				var element_form_item = document.createElement("p");
				element_form_item.innerHTML = "<b>" + item + ":</b> [" + mods_menu_data_mods[item].length + "]";
				element_form.appendChild(element_form_item);
			} else if(item.substring(0, 5) === "mods_") {
				// menu HTML: form, item (mods)
				var element_form_item = document.createElement("p");
				element_form_item.innerHTML = "<b>" + item + ":</b>";
				element_form.appendChild(element_form_item);
				for(var i = 0; i < mods_menu_data_mods[item].length; i++) {
					var name = mods_menu_data_mods[item][i];

					// menu HTML: form, item (mods), br
					var element_form_item_br = document.createElement("br");
					element_form_item.appendChild(element_form_item_br);

					// menu HTML: form, item (mods), radio button
					var element_form_item_input = document.createElement("input");
					element_form_item_input.setAttribute("id", "menu_form_" + item + "_" + i);
					element_form_item_input.setAttribute("type", "radio");
					element_form_item_input.setAttribute("name", item);
					element_form_item_input.setAttribute("value", name);
					if(i === 0)
						element_form_item_input.setAttribute("checked", true);
					element_form_item.appendChild(element_form_item_input);

					// menu HTML: form, item (mods), label
					var element_form_item_label = document.createElement("label");
					element_form_item_label.innerHTML = name;
					element_form_item.appendChild(element_form_item_label);
				}
			}
		}

		// menu HTML: form, hr
		var element_hr = document.createElement("hr");
		element_form.appendChild(element_hr);

		// menu HTML: form, player
		var element_form_player = document.createElement("p");
		element_form_player.innerHTML = "<b>default:</b> Player: ";
		element_form.appendChild(element_form_player);
		{
			// menu HTML: form, player, input
			var element_form_player_input = document.createElement("input");
			element_form_player_input.setAttribute("id", "menu_form_player");
			element_form_player_input.setAttribute("type", "text");
			element_form_player_input.setAttribute("value", "Anonymous");
			element_form_player_input.setAttribute("onkeyup", "mods_menu_title()");
			element_form_player.appendChild(element_form_player_input);
		}

		// menu HTML: form, speed
		var element_form_speed = document.createElement("p");
		element_form_speed.innerHTML = "<b>default:</b> Speed: ";
		element_form.appendChild(element_form_speed);
		{
			// menu HTML: form, speed, input
			var element_form_speed_input = document.createElement("input");
			element_form_speed_input.setAttribute("id", "menu_form_speed");
			element_form_speed_input.setAttribute("type", "number");
			element_form_speed_input.setAttribute("value", "1");
			element_form_speed_input.setAttribute("step", "0.1");
			element_form_speed_input.setAttribute("min", "0.1");
			element_form_speed_input.setAttribute("max", "10");
			element_form_speed.appendChild(element_form_speed_input);
		}

		for(var settings_mod in settings) {
			for(var settings_variable in settings[settings_mod]) {
				var variable = settings[settings_mod][settings_variable];

				// menu HTML: form, variables
				var element_form_variables = document.createElement("p");
				element_form_variables.innerHTML = "<b>" + settings_mod + ":</b> " + variable.label + ": ";
				element_form.appendChild(element_form_variables);
				{
					// menu HTML: form, variables, input
					var element_form_variables_input = document.createElement("input");
					element_form_variables_input.setAttribute("id", "menu_form_" + settings_variable);
					element_form_variables_input.setAttribute("name", settings_variable);
					element_form_variables_input.setAttribute("class", settings_mod);
					element_form_variables_input.class = settings_mod;
					if(typeof variable.value === "number" || !isNaN(variable.value)) {
						var value_min = (variable.value_min && variable.value_max) ? variable.value_min : 0;
						var value_max = (variable.value_min && variable.value_max) ? variable.value_max : 1;
						var value_step = (value_max - value_min) / 20;
						element_form_variables_input.setAttribute("type", "number");
						element_form_variables_input.setAttribute("value", variable.value);
						element_form_variables_input.setAttribute("step", value_step);
						element_form_variables_input.setAttribute("min", value_min);
						element_form_variables_input.setAttribute("max", value_max);
					} else {
						element_form_variables_input.setAttribute("type", "text");
						element_form_variables_input.setAttribute("value", variable.value);
					}
					element_form_variables.appendChild(element_form_variables_input);
				}
			}
		}
	}

	// menu HTML: button (load)
	var element_button_load = document.createElement("button");
	element_button_load.setAttribute("id", "menu_form_button_load");
	element_button_load.setAttribute("style", "position:absolute; top: 90%; left: 0%; width: 50%; height: 10%");
	element_button_load.setAttribute("onclick", "mods_menu_button_load()");
	element_button_load.innerHTML = "Load JSON files";
	element.appendChild(element_button_load);

	// menu HTML: button (start)
	var element_button_start = document.createElement("button");
	element_button_start.setAttribute("id", "menu_form_button_start");
	element_button_start.setAttribute("style", "position:absolute; top: 90%; left: 50%; width: 50%; height: 10%");
	element_button_start.setAttribute("onclick", "mods_menu_button_start()");
	element_button_start.innerHTML = "Start new world";
	element.appendChild(element_button_start);

	// set the page title
	mods_menu_title();
}

// if no data exists, show the mods menu
// if data exists, the scene will be loaded in scene.js instead
if(!data)
	mods_menu_add();
