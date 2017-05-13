// script 2, data.js
// Public Domain / CC0, MirceaKitsune 2016
// manages writing and reading data to and from browser cookies

// data objects
var data_name = null;
var data = null;

// initiates the data, returns true if initiated
function data_init(name, message) {
	if (message) alert(message);
	if (name != null) {
		data_name = name;
		data_write();
		location.search = "data=" + data_name;
	} else if (!data_name) {
		data_name = get_search("data");
	}

	return data_name ? true : false;
}

// clears data in cookie
function data_clear(message) {
	if (!data_init(null, null)) return;
	if (message) alert(message);

	data = null;
	var time = new Date();
	document.cookie = data_name + "=; expires=" + time.toUTCString();
	location.search = "";
}

// writes data to cookie
function data_write() {
	if (!data || !data_init(null, null)) return;

	var expire = 365 * 24 * 60 * 60; // year, hour, minute, second
	var string = JSON.stringify(data);
	var time = new Date();
	time.setTime(time.getTime() + 1 * expire * 1000);
	document.cookie = data_name + "=" + string + "; expires=" + time.toUTCString();
}

// reads data from a cookie
function data_read() {
	if (!data_init(null, null)) return;

	var table = document.cookie.match(new RegExp(data_name + "=([^;]+)"));
	if (table) {
		data = JSON.parse(table[1]);
	}
}

// load data if any exists
data_read();

// gets a field from the data
function data_field_get (field) {
	if (!data || !data_init(null, null)) return null;

	return data[field];
}

// sets a field in the data
function data_field_set (field, value) {
	if (!data || !data_init(null, null)) return;

	data[field] = value;
	data_write();
}
