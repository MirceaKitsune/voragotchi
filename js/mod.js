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

	// store the indexes of the mods we've selected
	var data_mods = {};
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].name.substring(0, 5) == "mods_" && elements[i].checked) {
			var name = elements[i].name;
			data_mods[name] = elements[i].value;
		}
	}

	// store the starting variables
	var data_variables = {
		time_start: date_time,
		time_last: date_time,
		game_name: elements["menu_form_player"].value || "Player",
		game_speed: elements["menu_form_difficulty"].value || "1"
	};

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
	var name = elements["menu_form_player"].value || "Player";
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
	var text = "";

	// load available mods from files
	mods_menu_data_mods = {};
	var files = mods_menu_data_files.split("\n");
	for(var i = 0; i < files.length; i++) {
		var file = get_json(files[i]);
		for (var item in file) {
			for (var mod in file[item]) {
				mods_menu_data_mods[item] = mods_menu_data_mods[item] || [];
				mods_menu_data_mods[item].push(mod);
			}
		}
	}

	// menu HTML: file list
	text +=
		"<textarea id=\"menu_list\"" +
		"style=\"resize: none; position:absolute; top: 0%; left: 0%;  width: 50%; height: 90%\">" +
		mods_menu_data_files + "</textarea>";
	// menu HTML: form
	text +=
		"<form id=\"menu_form\"" +
		"style=\"overflow: auto; position:absolute; top: 0%; left: 50%;  width: 50%; height: 90%\">";
	{
		// menu HTML: form, name
		text +=
			"<p>data_name: " +
			"<input type=\"text\" id=\"menu_form_name\" value=\"default\"></p>";
		// menu HTML: form, mods
		for (var item in mods_menu_data_mods) {
			if (item.substring(0, 5) == "data_") {
				// menu HTML: form, item (data)
				text += "<p>" + item + ": [" + mods_menu_data_mods[item].length + "]</p>";
			} else if (item.substring(0, 5) == "mods_") {
				// menu HTML: form, item (mods)
				text += "<p>" + item + ":</p>";
				for(var i = 0; i < mods_menu_data_mods[item].length; i++) {
					// menu HTML: form, item (mods), radio button
					var name = mods_menu_data_mods[item][i];
					text +=
						"<input type=\"radio\" " +
						"id=\"menu_form_" + item + "_" + i + "\" " +
						"name=\"" + item + "\" " +
						"value=\"" + name + "\" " +
						(i == 0 ? "checked=\"checked\" " : "") +
						">" + name + "<br\>";
				}
			}
		}
		text += "<hr\>";
		// menu HTML: form, player
		text +=
			"<p>Player name: " +
			"<input type=\"text\" id=\"menu_form_player\" value=\"Player\" onkeyup=\"mods_menu_title()\"></p>";
		// menu HTML: form, difficulty
		text +=
			"<p>Difficulty: " +
			"<input type=\"number\" id=\"menu_form_difficulty\" value=\"1\" step=\"0.1\" min=\"0.1\" max=\"10\"></p>";
	}
	text += "</form>";
	// menu HTML: button (load)
	text +=
		"<button id=\"menu_form_button_load\"" +
		"onclick=\"mods_menu_button_load()\"" +
		"style=\"position:absolute; top: 90%; left: 0%; width: 50%; height: 10%\">" +
		"Load JSON files</button>";
	// menu HTML: button (start)
	text +=
		"<button id=\"menu_form_button_start\"" +
		"onclick=\"mods_menu_button_start()\"" +
		"style=\"position:absolute; top: 90%; left: 50%; width: 50%; height: 10%\">" +
		"Start new world</button>";

	// configure the HTML element of the menu
	var element = document.getElementById("menu");
	if (!element) {
		element = document.createElement("div");
		element.setAttribute("id", "menu");
		element.setAttribute("style", "width: 100%; height: 100%; background-color: #c0c0c0");
		canvas.appendChild(element);
	}
	element.innerHTML = text;

	// set the page title
	mods_menu_title();
}

// if no data exists, show the mods menu
// if data exists, the scene will be loaded in scene.js instead
if (!data) {
	mods_menu_add();
}
