(function define_horde_Mouse () {

horde.Mouse = function (canvas) {
	this.buttonStates = {};
	this.mouseX = 0;
	this.mouseY = 0;
	this.canvas = canvas;
	this.lastButtonStates = {};
	horde.on("mousemove", this.handleMouseMove, canvas, this);
	horde.on("mousedown", this.handleMouseDown, canvas, this);
	horde.on("mouseup", this.handleMouseUp, window, this);

	/*
	// iOS
	horde.on("touchmove", this.handleMouseMove, window, this);
	horde.on("touchstart", this.handleMouseDown, window, this);
	horde.on("touchend", this.handleMouseUp, window, this);	
	*/
};

var Mouse = horde.Mouse;
var proto = Mouse.prototype;

Mouse.Buttons = {
	LEFT: 0,
	RIGHT: 2
};

proto.handleMouseMove = function (e) {
	if (!this.canvas) return;
	var rect = this.canvas.getBoundingClientRect();
	var clientX = e.clientX;
	var clientY = e.clientY;
	if (clientX === undefined && e.touches && e.touches[0]) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	}
	this.mouseX = Math.max(0, Math.min(640, ((clientX - rect.left) * 640) / (rect.width || 640)));
	this.mouseY = Math.max(0, Math.min(480, ((clientY - rect.top) * 480) / (rect.height || 480)));
	this.hasMoved = true;
};

proto.handleMouseDown = function (e) {
	// iOS
	/*
	this.buttonStates[Mouse.Buttons.LEFT] = true;
	or e.button = Mouse.Buttons.LEFT;
	*/
	this.buttonStates[e.button] = true;
	horde.stopEvent(e);
	if (window.focus) window.focus();
};

proto.handleMouseUp = function (e) {
	// iOS
	/*
	this.buttonStates[Mouse.Buttons.LEFT] = true;
	or e.button = Mouse.Buttons.LEFT;
	*/
	this.buttonStates[e.button] = false;
};

proto.isButtonDown = function (button) {
	return this.buttonStates[button];
};

proto.isAnyButtonDown = function () {
	for (var key in this.buttonStates) {
		if (this.buttonStates[key]) {
			return true;
		}
	}

	return false;
};

proto.clearButtons = function () {
	this.buttonStates = {};
};

proto.wasButtonClicked = function (button) {
	return (this.buttonStates[button] && !this.lastButtonStates[button]);
};

proto.storeButtonStates = function () {
	for (var key in this.buttonStates) {
		this.lastButtonStates[key] = this.buttonStates[key];
	}
};

}());
