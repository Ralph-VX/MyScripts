//=============================================================================
// Multi Touch Support
// BetterTouchMouseInput.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_BetterTouchMouseInput = true;

var Kien = Kien || {};
Kien.BetterTouchMouseInput = {};
//=============================================================================
/*:
 * @plugindesc Better Mouse Input API and Multitouch support in touch supported device.
 * @author Kien
 * @requiredAssets img/system/buttonTemplateLocked
 * @requiredAssets img/system/buttonTemplateSelected
 * @requiredAssets img/system/buttonTemplate
 *
 * @param Flick Length
 * @desc Length in Frames to let a swipe consider as Flick/Short Touch.
 * 60 Frames = 1 Second.
 * @default 15
 *
 * @param Long Touch Length
 * @desc Length in Frames to let a swipe consider as Hold Touch.
 * 60 Frames = 1 Second.
 * @default 45
 *
 * @param MultiTouch Threshold
 * @desc Amount of frames that allow multiple touches considered as "Touch in same time"
 * 60 Frames = 1 Second.
 * @default 5
 *
 * @param Swipe Threshold
 * @desc Amount of pixels the touch point need to move to consider as swipe/flick.
 * Screen Touch that is moved below this value will be considered as Touch/Long Touch.
 * @default 15
 *
 * @param Double Click Interval
 * @desc Amount of frames between two click event that will considered as double click.
 * Largere value will have longer interval but bad response when distinguishing double and single click.
 * @default 10
 *
 * @param Debug Mode
 * @desc Output Debug Information from this plugin.
 * Will always not enabled when not in test-play.
 * @default false
 *
 * @help
 *
//=============================================================================
// Multi Touch Support
// BetterTouchMouseInput.js
// Version: 1.00
//=============================================================================
  Allow the multi touch screen function properly.

//=============================================================================
// Warning
//=============================================================================
  This plugin is directed at plugin maker, to allow them create touch UI with
less effort. By default, this plugin do.'t provide too many functionalities.
  This Plugin will overwrite a very large portion of core plugin. If you con-
tact me, I MAY try to fix conflicts with other plugins, but this is NOT promis-
ed.
//=============================================================================
// API Documentation
//=============================================================================
*/

Kien.BetterTouchMouseInput.parameters = PluginManager.parameters("BetterTouchMouseInput");
Kien.BetterTouchMouseInput.flickLength = parseInt(Kien.BetterTouchMouseInput.parameters["Flick Length"]);
Kien.BetterTouchMouseInput.longTouchLength = parseInt(Kien.BetterTouchMouseInput.parameters["Long Touch Length"]);
Kien.BetterTouchMouseInput.multiTouchThreshold = parseInt(Kien.BetterTouchMouseInput.parameters["MultiTouch Threshold"]);
Kien.BetterTouchMouseInput.swipeThreshold = parseInt(Kien.BetterTouchMouseInput.parameters["Swipe Threshold"]);
Kien.BetterTouchMouseInput.doubleClickInterval = parseInt(Kien.BetterTouchMouseInput.parameters["Double Click Interval"]);
Kien.BetterTouchMouseInput.debugMode = eval(Kien.BetterTouchMouseInput.parameters["Debug Mode"]);


if (!Imported.Kien_Lib) {
    throw new Error("No Library Found.\n Please put KienLib.js above this plugin.");
}

//-----------------------------------------------------------------------------
/**
 * The static class that handles input data from the keyboard and gamepads.
 *
 * @class Input
 */

Kien.BetterTouchMouseInput.Input__onKeyDown = Input._onKeyDown;
Input._onKeyDown = function(event) {
	Kien.BetterTouchMouseInput.Input__onKeyDown.apply(this, arguments);
	TouchInput.setInputMode("keyboard");
};

//-----------------------------------------------------------------------------
// TouchPoint
//
//   Represents a single touch point. Also provide functionalities to examine 
// The movement.

TouchPoint.flickLength = Kien.BetterTouchMouseInput.flickLength;
TouchPoint.longTouchLength = Kien.BetterTouchMouseInput.longTouchLength;
TouchPoint.swipeThreshold = Kien.BetterTouchMouseInput.swipeThreshold;
TouchPoint.multiTouchThreshold = Kien.BetterTouchMouseInput.multiTouchThreshold;

function TouchPoint() {
	this.initialize.apply(this, arguments);
}

Object.defineProperty(TouchPoint.prototype, 'x', {
	get: function() {
		return this._x;
	},
	configurable: true
});

Object.defineProperty(TouchPoint.prototype, 'y', {
	get: function() {
		return this._y;
	},
	configurable: true
});

TouchPoint.prototype.initialize = function(touch) {
	this._identifier = touch.identifier;
	this._x = Graphics.pageToCanvasX(touch.pageX);
	this._y = Graphics.pageToCanvasY(touch.pageY);
	this._initX = this._x;
	this._initY = this._y;
	this._path = [];
	this._path.push({'x': this._x, 'y': this._y, 'dx' : 0, 'dy' : 0, 'distance': 0});
	this._startFrame = Graphics.frameCount;
	this._endFrame = -1;
	this._isTouched = false;
	this._isTouching = true;
	this._isSwiped = false;
	this._isFlicked = false;
	this._swipeDistance = -1;
	this._swipeStrength = -1;
	this._isLongTouched = false;
	this._finish = false;
	this._distance = 0;
	this._duration = -1;
}

TouchPoint.prototype.isTouched = function() {
	return this._isTouched;
}

TouchPoint.prototype.isTouching = function() {
	return this._isTouching;
}

TouchPoint.prototype.isSwiped = function() {
	return this._isSwiped;
}

TouchPoint.prototype.isFlicked = function() {
	return this._isFlicked;
}

TouchPoint.prototype.isLongTouched = function() {
	return this._isLongTouched;
}

TouchPoint.prototype.distance = function() {
	return this._swipeDistance;
}

TouchPoint.prototype.strength = function() {
	return this._swipeStrength;
}

TouchPoint.prototype.touchLength = function() {
	return this._endFrame >= 0 ? this._endFrame - this._startFrame : Graphics.frameCount - this._startFrame;
}

TouchPoint.prototype.onMove = function(touch) {
	this._x = Graphics.pageToCanvasX(touch.pageX);
	this._y = Graphics.pageToCanvasY(touch.pageY);
	var dx = this._x - this._path[this._path.length - 1].x; 
	var dy = this._y - this._path[this._path.length - 1].y;
	this._path.push({x: this._x, y: this._y, 'dx' : dx, 'dy' : dy});
	var dis = Math.sqrt(dx * dx + dy * dy);
	this._distance += dis;
	this._path[this._path.length - 1].distance = dis;
}

TouchPoint.prototype.onEnd = function(touch) {
	this._x = Graphics.pageToCanvasX(touch.pageX);
	this._y = Graphics.pageToCanvasY(touch.pageY);
	var dx = this._x - this._path[this._path.length - 1].x; 
	var dy = this._y - this._path[this._path.length - 1].y;
	this._path.push({x: this._x, y: this._y, 'dx':dx, 'dy':dy});
	var dis = Math.sqrt(dx * dx + dy * dy);
	this._distance += dis;
	this._path[this._path.length - 1].distance = dis;
	this._isTouching = false;
	this.examinePath();
}

TouchPoint.prototype.examinePath = function() {
	this._endFrame = Graphics.frameCount;
	var dt = this.touchLength();
	if (this._distance < TouchPoint.swipeThreshold) {
		if (dt >= TouchPoint.longTouchLength) {
			this._isLongTouched = true;
		} else {
			this._isTouched = true;
		}
	} else {
		if (dt < TouchPoint.flickLength) {
			this._isFlicked = true;
		} else {
			this._isSwiped = true;
		}
	}
	this._swipeDistance = this._distance;
	this._swipeStrength = this._distance / dt;
	this._finish = true;
	this._duration = TouchPoint.multiTouchThreshold;
}

/** Obtain the swipe's movement data that is splitted splits times.
      data is returned in an array form, each element of data represents one action.
      each data have following datas:
      	distance: distance of movement.
      	dx: distance in x direction.
      	dy: distance in y direction.
      	angle: angle of movement where 0 represents positive direction on x-axis.
*/
TouchPoint.prototype.getSwipeData = function(splits) {
	splits = splits || 1;
	var ret = [];
	var dif = (this._path.length-1) / splits;
	var lastPoint = this._path[0];
	for (var n = dif; n <= this._path.length-1; n += dif) {
		var curPoint = this.getDataCompletion(this._path, dif);
		var obj = {
			'dx': curPoint.x - lastPoint.x,
			'dy': curPoint.y - lastPoint.y
		};
		obj.distance = Math.sqrt(obj.dx * obj.dx + obj.dy * obj.dy);
		obj.angle = (Math.rad2Deg(Math.atan2(obj.dy, obj.dx)) + 360) % 360;
		obj.dydx = obj.dy / obj.dx;
		obj.ddydxx = obj.dydx / obj.dx;
		obj.startPoint = lastPoint;
		obj.endPoint = curPoint;
		ret.push(obj);
		lastPoint = curPoint;
	}
	return ret;
}

TouchPoint.prototype.getSwipeDataByDistance = function(splits, distanceGroup) {
	splits = splits || 1;
	var ret = [];
	var dif = this._distance / splits;
	var distanceGroupIndex = 0;
	if (distanceGroup) {
		dif = distanceGroup[distanceGroupIndex];
	}
	var lastPoint = {'x': this._initX, 'y': this._initY};
	var curdist = 0;
	for (var i = 0; i < this._path.length; n++) {
		var curPoint = this._path[n]
		curdist += curPoint.distance;
		if (curdist >= dif) {
			curdist -= dif;
			var per = curdist / dif;
			curPoint = getDataCompletion(this._path, i-per);
			var obj = {
				'dx' : curPoint.x - lastPoint.x,
				'dy' : curPoint.y - lastPoint.y
			};
			obj.distance = dif;
			obj.angle = (Math.rad2Deg(Math.atan2(obj.dy, obj.dx)) + 360) % 360;
			obj.dydx = obj.dy / obj.dx;
			obj.ddydxx = obj.dydx / obj.dx;
			obj.startPoint = lastPoint;
			obj.endPoint = curPoint;
			ret.push(obj);
			lastPoint = curPoint;
			distanceGroupIndex++;
			if (distanceGroupIndex >= distanceGroup.length) {
				break;
			} else {
				dif = distanceGroup[distanceGroupIndex];
			}
		}
	}
	return ret;
}


TouchPoint.prototype.getDataCompletion = function(list, index) {
	var i = Math.floor(index);
	var ni = Math.ceil(index);
	var per = index - i;
	if (per == 0) {
		return list[i];
	} else if (ni >= list.length) {
		return list[i];
	} else {
		return obj = {
			'x': list[i].x + (list[ni].x - list[i].x) * per,
			'y': list[i].y + (list[ni].y - list[i].y) * per
		}
	}
}

TouchPoint.prototype.getSwipeDirection = function() {
    var data = this.getSwipeData()[0];
    var angle = (data.angle + 45) % 360;
    if (angle < 90) {
    	return 6;
    } else if (angle < 180) {
    	return 8
    } else if (angle < 270) {
    	return 4
    } else {
    	return 2
    }
}

//-----------------------------------------------------------------------------
// MouseButton
//
//   Represents a single Mouse Button. For "object-oriented".

function MouseButton() {
	this.initialize.apply(this, arguments);
}

MouseButton.prototype.initialize = function(button) {
	this._button = button;
	this._interval = -1;
	this._triggered = false;
	this._isNonDoubleTriggered = false; // Will be true when double click interval is finish.
	this._eventTriggered = false;
	this._released = false;
	this._eventReleased = false;
	this._down = false;
	this._isDouble = false;
}

MouseButton.prototype.processEvent = function(event) {
	switch (event.type) {
		case 'mouseup' :
			this.processMouseUp(event);
			break;
		case 'mousedown':
			this.processMouseDown(event);
			break;
	}
}

MouseButton.prototype.processMouseUp = function(event) {
	if (event.button === this._button) {
		this._eventReleased = true;
		this._down = false;
		this._isDouble = false;
		this._interval = 0;
	}
}

MouseButton.prototype.processMouseDown = function(event) {
	if (event.button === this._button) {
		this._eventTriggered = true;
		this._down = true;
		if (this._interval > 0) {
			this._isDouble = true;
		}
		this._interval = 0;
	}
}

MouseButton.prototype.update = function() {
	this._triggered = this._eventTriggered;
	this._released = this._eventReleased;
	this._eventTriggered = false;
	this._eventReleased = false;
	this._isNonDoubleTriggered = false;
	if (TouchInput._kienIsFrameChanged) {
		if (this._interval >= 0 && !this._down) {
			this._interval++;
			if (this._interval > Kien.BetterTouchMouseInput.doubleClickInterval) {
				this._interval = -1;
				this._isNonDoubleTriggered = true;
			}
		} else if (this._down) {
			this._interval++;
		}
	}
}

MouseButton.prototype.isTriggered = function() {
	return this._triggered;
}

MouseButton.prototype.isReleased = function() {
	return this._released;
}

MouseButton.prototype.isPressed = function() {
	return this._down;
}

MouseButton.prototype.isDoubleClicked = function() {
	return this._isDouble;
}

MouseButton.prototype.isNonDoubleTriggered = function() {
	return this._isNonDoubleTriggered;
}

MouseButton.prototype.isRepeated = function() {
    return (this.isPressed() &&
            (this.isTriggered() ||
             (this._interval >= TouchInput.keyRepeatWait &&
              (this._interval-TouchInput.keyRepeatWait) % TouchInput.keyRepeatInterval === 0)));
};


//-----------------------------------------------------------------------------
/**
 * The static class that handles input data from the mouse and touchscreen.
 *
 * @class TouchInput
 */

TouchInput._nameButtonConvert = {
	"0" : "left",
	"1" : "middle",
	"2" : "right", 
	"left" : 0,
	"leftbutton" : 0,
	"leftclick" : 0,
	"leftButton" : 0,
	"leftClick" : 0,
	"left_click" : 0,
	"left_button" : 0,
	"middle" : 1,
	"middlebutton" : 1,
	"middleButton" : 1,
	"middleclick" : 1,
	"middleClick" : 1,
	"middle_button" : 1,
	"middle_click" : 1,
	"right" : 2,
	"rightbutton" : 2,
	"rightButton" : 2,
	"rightclick" : 2,
	"rightClick" : 2,
	"right_button" : 2,
	"right_click" : 2,
}

Kien.BetterTouchMouseInput.TouchInput_clear = TouchInput.clear;
TouchInput.clear = function() {
	Kien.BetterTouchMouseInput.TouchInput_clear.apply(this, arguments);
	this._kienTouches = {};
	this._kienReturnedTouchIdentifiers = []
	this._kienTouchIdentifiers = [];
	this._kienFrameCount = Graphics.frameCount;
	this._kienIsFrameChanged = false;
	this._kienModeChangeWait = false;
	this._kienModeChanged = false;
	this._kienMouseProperties = {
		"buttons" : [],
		"cursorX" : -1,
		"cursorY" : -1,
		"cursorMoved" : false,
		"cursorMovedEvent" : false
	};
	// For safety, we use 0-4 although typical mosue only have 3.
	for (var i = 0; i < 5; i++) {
		this._kienMouseProperties.buttons.push(new MouseButton(i));
	}
	this._kienInputMode = Utils.isMobileDevice() ? "touch" : "keyboard";

	this.clearKienEvent();
}

Kien.BetterTouchMouseInput.TouchInput_update = TouchInput.update;
TouchInput.update = function() {
	Kien.BetterTouchMouseInput.TouchInput_update.apply(this, arguments);
	if (Graphics.frameCount != this._kienFrameCount) {
		this._kienFrameCount = Graphics.frameCount;
		this._kienIsFrameChanged = true
	}
	this.updateDebug();
	this.clearFinishedTouch();
	this.updateKienTouch();
	this.updateMouseEvent();
	this.clearKienEvent();
	if (this._kienIsFrameChanged) {
		if (this._kienModeChangeWait) {
			this._kienModeChangeWait = false;
		} else {
			this._kienModeChanged = false;
		}
	}
	this._kienIsFrameChanged = false;
}

TouchInput.updateDebug = function() {
	/*if (DebugDiv) {
		DebugDiv.clear();
		for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
			var ti = this._kienTouchIdentifiers[n];
			var tp = this._kienTouches[ti];
			DebugDiv.addString("id: " + ti + ", x: " + tp.x + ", y: " + tp.y + ", dur: " + tp._duration)
		}
	}*/
}

TouchInput.clearFinishedTouch = function() {
	var callback = function(obj) { 
		return TouchInput._kienTouches[obj]._finish && TouchInput._kienTouches[obj]._duration <= 0; 
	};
	var i = this._kienTouchIdentifiers.findIndex(callback);
	while (i >= 0) {
		var ti = this._kienTouchIdentifiers[i];
		var callback2 = function(obj) {return obj._identifier == ti};
		this._kienTouchIdentifiers.splice(i, 1);
		delete this._kienTouches[ti];
		var ii = this._kienReturnedTouchIdentifiers.indexOf(ti);
		if (ii >= 0) {
			this._kienReturnedTouchIdentifiers.splice(ii, 1);
		}
		i = this._kienTouchIdentifiers.findIndex(callback);
	}
}

TouchInput.clearKienEvent = function() {
	this._kienTouchStartEvent = [];
	this._kienTouchMoveEvent = [];
	this._kienTouchEndEvent = [];
	this._kienMouseEvent = [];
}

TouchInput.updateKienTouch = function() {
	var bool = false;
	if (this._kienIsFrameChanged) {
		for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
			var ti = this._kienTouchIdentifiers[n];
			var tp = this._kienTouches[ti];
			if (tp._finish && tp._duration > 0) {
				tp._duration--;
			}
		}
	}
	for (var n = 0; n < this._kienTouchMoveEvent.length; n++ ) {
		var touch = this._kienTouchMoveEvent[n];
		var tp = this._kienTouches[touch.identifier];
		if (tp) {
			bool = true;
			tp.onMove(touch);
		}
	}
	for (var n = 0; n < this._kienTouchEndEvent.length; n++ ) {
		var touch = this._kienTouchEndEvent[n];
		var tp = this._kienTouches[touch.identifier];
		if (tp) {
			bool = true;
			tp.onEnd(touch);
		}
	}
	if (Kien.BetterTouchMouseInput.debugMode) {
		for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
			var ti = this._kienTouchIdentifiers[n];
			var tp = this._kienTouches[ti];
		}
	}
	if (bool) {
		this.setInputMode("touch");
	}
}

TouchInput.updateMouseEvent = function() {
	this.updateKienMouseProperty();
	for (var i = 0; i < this._kienMouseProperties.buttons.length; i++) {
		this._kienMouseProperties.buttons[i].update();
	}
	for (var i = 0; i < this._kienMouseEvent.length; i++) {
		var e = this._kienMouseEvent[i];
		this._kienMouseProperties.buttons[e.button].processEvent(e);
	}
}

TouchInput.updateKienMouseProperty = function() {
	this._kienMouseProperties["cursorMoved"] = this._kienMouseProperties["cursorMovedEvent"];
	this._kienMouseProperties["cursorMovedEvent"] = false;
}

TouchInput._kienOnTouchStart = function(event) {
	for (var n = 0; n < event.changedTouches.length; n++) {
		var t = event.changedTouches[n];
		var tp = new TouchPoint(t);
		this._kienTouches[t.identifier] = tp;
		this._kienTouchStartEvent.push(t);
		if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
			this._kienTouchIdentifiers.push(t.identifier);
			this.setInputMode("touch");
		}
	}
	this._kienRemoveUnavailablePoint(event);
}

Kien.BetterTouchMouseInput.TouchInput_onTouchStart = TouchInput._onTouchStart;
TouchInput._onTouchStart = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onTouchStart.apply(this, arguments);
	this._kienOnTouchStart(event);
}


Kien.BetterTouchMouseInput.TouchInput_onTouchMove = TouchInput._onTouchMove;
TouchInput._onTouchMove = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onTouchMove.apply(this, arguments);
	this._kienOnTouchMove(event);
}

TouchInput._kienOnTouchMove = function(event) {
	for (var n = 0; n < event.changedTouches.length; n++) {
		var t = event.changedTouches[n];
		var tp = this._kienTouches[t.identifier];
		if (!tp) {
			// Prevent unexpected error. Add a new point into list.
			tp = new TouchPoint(t);
			this._kienTouches[t.identifier] = tp;
			if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
				this._kienTouchIdentifiers.push(t.identifier);
			}
		}
		this._kienTouchMoveEvent.push(t);
	}
	this._kienRemoveUnavailablePoint(event);
}

Kien.BetterTouchMouseInput.TouchInput_onTouchEnd = TouchInput._onTouchEnd;
TouchInput._onTouchEnd = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onTouchEnd.apply(this, arguments);
	this._kienOnTouchEnd(event);
}

Kien.BetterTouchMouseInput.TouchInput_onTouchCancel = TouchInput._onTouchCancel;
TouchInput._onTouchCancel = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onTouchCancel.apply(this, arguments);
	this._kienOnTouchEnd(event);
}

TouchInput._kienOnTouchEnd = function(event) {
	for (var n = 0; n < event.changedTouches.length; n++) {
		var t = event.changedTouches[n];
		var tp = this._kienTouches[t.identifier];
		if (!tp) {
			// Prevent unexpected error. Add a new point into list.
			tp = new TouchPoint(t);
			this._kienTouches[t.identifier] = tp;
			if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
				this._kienTouchIdentifiers.push(t.identifier);
			}
		}
		this._kienTouchEndEvent.push(t);
	}
}

// Find the identifier that is not exists in event, but still available in system.
TouchInput._kienRemoveUnavailablePoint = function(event) {
	var allidentifiers = [];
	var unavailableidentifier = [];
	for (var n = 0; n < event.touches.length; n++) {
		allidentifiers.push(event.touches[n].identifier);
	}
	for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
		var ti = this._kienTouchIdentifiers[n];
		if (!allidentifiers.contains(ti)) {
			unavailableidentifier.push(ti);
		}
	}
	for (var n = 0; n < unavailableidentifier.length; n++) {
		var ti = unavailableidentifier[n];
		var callback = function(o) { return o == ti; };
		var i = this._kienTouchIdentifiers.findIndex(callback);
		while (i >= 0) {
			this._kienTouchIdentifiers.splice(i,1);
			i = this._kienTouchIdentifiers.findIndex(callback);
		}
		delete this._kienTouches[ti];
	}
}

Kien.BetterTouchMouseInput.TouchInput_onMouseDown = TouchInput._onMouseDown;
TouchInput._onMouseDown = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onMouseDown.apply(this, arguments);
	this._kienMouseEvent.push(event);
	this.setInputMode("mouse");
};

Kien.BetterTouchMouseInput.TouchInput_onMouseUp = TouchInput._onMouseUp;
TouchInput._onMouseUp = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onMouseUp.apply(this, arguments);
	this._kienMouseEvent.push(event);
	this.setInputMode("mouse");
}

Kien.BetterTouchMouseInput.TouchInput_onMouseMove = TouchInput._onMouseMove;
TouchInput._onMouseMove = function(event) {
	Kien.BetterTouchMouseInput.TouchInput_onMouseMove.apply(this, arguments);
	this._kienMouseMove(event);
}

TouchInput._kienMouseMove = function(event) {
	var x = Graphics.pageToCanvasX(event.pageX);
	var y = Graphics.pageToCanvasY(event.pageY);
	this._kienMouseProperties.cursorX = x;
	this._kienMouseProperties.cursorY = y;
	this._kienMouseProperties.cursorMovedEvent = true;
	this.setInputMode("mouse");
}

TouchInput.setInputMode = function(mode) {
	if (this._kienInputMode != mode) {
		this._kienInputMode = mode;
		this._kienModeChanged = true;
		this._kienModeChangeWait = true;
	}
}

// API Space

// TouchInput.isTouched(fingers, forceNew, mustEqual)
//   return null if no touch action is performed, or the amount of finger is not enough.
//   return TouchPoint object if exists one, or an array of TouchPoint object when fingers is specified above 1.
//   When forceNew is set to true, this operation will limit to 'new' touches only.
//   When mustEqual is set to true, this function will only return when the finger amount equal to the fingers.
TouchInput.isTouched = function(fingers, forceNew, mustEqual) {
	fingers = (fingers) ? ((fingers >= 0) ? fingers : 0)  : 0;
	var arr = this._kienTouchIdentifiers;
	if (!!forceNew) {
		arr = arr.filter(function(obj) {
			return this._kienReturnedTouchIdentifiers.indexOf(obj) === -1; 
		}.bind(this));
	}
	if (fingers == 1) {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isTouched() && tp._duration == 0) {
				ret.push(tp);
			}
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	} else {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isTouched()) {
				ret.push(tp);
				if (fingers == 0) {
					if (this._kienReturnedTouchIdentifiers.indexOf(tp._identifier) === -1) {
						this._kienReturnedTouchIdentifiers.push(tp._identifier);
					}
				}
			}
		}
		if (ret.length == 0) {
			return null;
		}
		if (fingers == 0) {
			return ret;
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	}
	return null;
}

// TouchInput.isLongTouched(fingers, forceNew, mustEqual)
//   return null if no Long Touch action is performed, or the amount of finger is not enough.
//   return TouchPoint object if exists one, or an array of TouchPoint object when fingers is specified above 1.
//   When forceNew is set to true, this operation will limit to 'new' touches only.
//   When mustEqual is set to true, this function will only return when the finger amount equal to the fingers.
TouchInput.isLongTouched = function(fingers, forceNew, mustEqual) {
	fingers = (fingers) ? ((fingers >= 0) ? fingers : 0)  : 0;
	var arr = this._kienTouchIdentifiers;
	if (!!forceNew) {
		arr = arr.filter(function(obj) {
			return this._kienReturnedTouchIdentifiers.indexOf(obj) === -1; 
		}.bind(this));
	}
	if (fingers == 1) {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isLongTouched() && tp._duration == 0) {
				ret.push(tp);
			}
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	} else {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isLongTouched()) {
				ret.push(tp);
				if (fingers == 0) {
					if (this._kienReturnedTouchIdentifiers.indexOf(tp._identifier) === -1) {
						this._kienReturnedTouchIdentifiers.push(tp._identifier);
					}
				}
			}
		}
		if (ret.length == 0) {
			return null;
		}
		if (fingers == 0) {
			return ret;
		}
		var result = [];
		for (var n = 0; n < ret.length; n++) {
			var base = ret[n];
			result = [base];
			for (var i = 0; i < ret.length; i++) {
				var next = ret[i];
				if (next._identifier != base._identifier) {
					if (Math.abs(base.touchLength() - next.touchLength()) < TouchPoint.multiTouchThreshold) {
						result.push(next);
					}
				}
			}
			var nret = TouchInput.extractTouches(result, fingers, mustEqual);
			if (!!nret) {
				return nret;
			}
		}
	}
	return null;
}

// TouchInput.isSwiped(fingers, forceNew, mustEqual)
//   return null if no swipe action is performed, or the amount of finger is not enough.
//   return TouchPoint object if exists one, or an array of TouchPoint object when fingers is specified above 1.
//   When forceNew is set to true, this operation will limit to 'new' touches only.
//   When mustEqual is set to true, this function will only return when the finger amount equal to the fingers.
TouchInput.isSwiped = function(fingers, forceNew, mustEqual) {
	fingers = (fingers) ? ((fingers >= 0) ? fingers : 0)  : 0;
	var arr = this._kienTouchIdentifiers;
	if (!!forceNew) {
		arr = arr.filter(function(obj) {
			return this._kienReturnedTouchIdentifiers.indexOf(obj) === -1; 
		}.bind(this));
	}
	if (fingers == 1) {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isSwiped() && tp._duration == 0) {
				ret.push(tp);
			}
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	} else {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isSwiped()) {
				ret.push(tp);
				if (fingers == 0) {
					if (this._kienReturnedTouchIdentifiers.indexOf(tp._identifier) === -1) {
						this._kienReturnedTouchIdentifiers.push(tp._identifier);
					}
				}
			}
		}
		if (ret.length == 0) {
			return null;
		}
		if (fingers == 0) {
			return ret;
		}
		var result = [];
		for (var n = 0; n < ret.length; n++) {
			var base = ret[n];
			result = [base];
			for (var i = 0; i < ret.length; i++) {
				var next = ret[i];
				if (next._identifier != base._identifier) {
					if (Math.abs(base.touchLength() - next.touchLength()) < TouchPoint.multiTouchThreshold) {
						result.push(next);
					}
				}
			}
			var nret = TouchInput.extractTouches(result, fingers, mustEqual);
			if (!!nret) {
				return nret;
			}
		}
	}
	return null;
}

// TouchInput.isFlicked(fingers, forceNew, mustEqual)
//   return null if no flick action is performed, or the amount of finger is not enough.
//   return all TouchPoint object that is satisfing, or an array of TouchPoint object when fingers is specified above 1.
//   When forceNew is set to true, this operation will limit to 'new' touches only.
//   When mustEqual is set to true, this function will only return when the finger amount equal to the fingers.
TouchInput.isFlicked = function(fingers, forceNew, mustEqual) {
	fingers = (fingers) ? ((fingers >= 0) ? fingers : 0)  : 0;
	var arr = this._kienTouchIdentifiers;
	if (!!forceNew) {
		arr = arr.filter(function(obj) {
			return this._kienReturnedTouchIdentifiers.indexOf(obj) === -1; 
		}.bind(this));
	}
	if (fingers == 1) {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isFlicked() && tp._duration == 0) {
				ret.push(tp);
			}
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	} else {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isFlicked()) {
				ret.push(tp);
				if (fingers == 0) {
					if (this._kienReturnedTouchIdentifiers.indexOf(tp._identifier) === -1) {
						this._kienReturnedTouchIdentifiers.push(tp._identifier);
					}
				}
			}
		}
		if (ret.length == 0) {
			return null;
		}
		if (fingers == 0) {
			return ret;
		}
		var result = [];
		for (var n = 0; n < ret.length; n++) {
			var base = ret[n];
			result = [base];
			for (var i = 0; i < ret.length; i++) {
				var next = ret[i];
				if (next._identifier != base._identifier) {
					if (Math.abs(base.touchLength() - next.touchLength()) < TouchPoint.multiTouchThreshold) {
						result.push(next);
					}
				}
			}
			var nret = TouchInput.extractTouches(result, fingers, mustEqual);
			if (!!nret) {
				return nret;
			}
		}
	}
	return null;
}

// TouchInput.isTouching(fingers, forceNew, mustEqual)
//   return null if no finger is currently touching screen, or the amount of finger is not enough.
//   return All TouchPoint object that is satisfing, or an array of TouchPoint object when fingers is specified above 1.
//   When forceNew is set to true, this operation will limit to 'new' touches only.
//   When mustEqual is set to true, this function will only return when the finger amount equal to the fingers.
TouchInput.isTouching = function(fingers, forceNew, mustEqual) {
	fingers = (fingers) ? ((fingers >= 0) ? fingers : 0)  : 0;
	var arr = this._kienTouchIdentifiers;
	if (!!forceNew) {
		arr = arr.filter(function(obj) {
			return this._kienReturnedTouchIdentifiers.indexOf(obj) === -1; 
		}.bind(this));
	}
	if (fingers == 1) {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isTouching() && tp.touchLength() > TouchPoint.multiTouchThreshold) {
				ret.push(tp);
			}
		}
		var nret = TouchInput.extractTouches(ret, fingers, mustEqual);
		if (!!nret) {
			return nret;
		}
	} else {
		var ret = [];
		for (var i = 0; i < arr.length; i++) {
			var ti = arr[i];
			var tp = this._kienTouches[ti];
			if (tp.isTouching() && tp.touchLength() > TouchPoint.multiTouchThreshold) {
				ret.push(tp);
				if (fingers == 0) {
					if (this._kienReturnedTouchIdentifiers.indexOf(tp._identifier) === -1) {
						this._kienReturnedTouchIdentifiers.push(tp._identifier);
					}
				}
			}
		}
		if (ret.length == 0) {
			return null;
		}
		if (fingers == 0) {
			return ret;
		}
		var result = [];
		for (var n = 0; n < ret.length; n++) {
			var base = ret[n];
			result = [base];
			for (var i = 0; i < ret.length; i++) {
				var next = ret[i];
				if (next._identifier != base._identifier) {
					if (Math.abs(base._startFrame - next._startFrame) < TouchPoint.multiTouchThreshold) {
						result.push(next);
					}
				}
			}
			var nret = TouchInput.extractTouches(result, fingers, mustEqual);
			if (!!nret) {
				return nret;
			}
		}
	}
	return null;
}

/**
 * check that is the screen is been touched or not.
 *   return true if there is some touch action just be done.
 *   
 * 
 * @static
 * @method checkTouched
 * @param {Number} fingers Amount of fingers must be in same time.
 * @param {Boolean} forceNew Only check those touches not set as exclusive.
 * @param {Boolean} mustEqual The amount of finger on screen must equal to fingers. if forceNew is true, then the amount of non-excluded must be.
 * @param {Function} func function object that returns the requirements that the touch points must fulfill. in default, it is equal to function (touchPoints) { return true };
 * @param {Boolean} nonExclusive Fingers returned true will be exclusiive for other operations if this is set to true.
 * @return {Boolean} true if the action is performed.
 */
TouchInput.checkTouched = function(fingers, forceNew, mustEqual, nonExclusive, func) {
	fingers = fingers || 1;
	var touch = this.isTouched(fingers, forceNew, mustEqual);
	if (touch) {
		if (!func || func(touch)) {
			if (nonExclusive) {
				this.deallocateTouch(touch);
			}
			return true;
		}
	}
	this.deallocateTouch(touch);
	return false;
}

/**
 * check that is the screen is been long touched or not.
 *   return true if there is some touch action just be done.
 *   
 * 
 * @static
 * @method checkLongTouched
 * @param {Number} fingers Amount of fingers must be in same time.
 * @param {Boolean} forceNew Only check those touches not set as exclusive.
 * @param {Boolean} mustEqual The amount of finger on screen must equal to fingers. if forceNew is true, then the amount of non-excluded must be.
 * @param {Function} func function object that returns the requirements that the touch points must fulfill. in default, it is equal to function (touchPoints) { return true };
 * @param {Boolean} nonExclusive Fingers returned true will be exclusiive for other operations if this is set to true.
 * @return {Boolean} true if the action is performed.
 */
TouchInput.checkLongTouched = function(fingers, forceNew, mustEqual, nonExclusive, func) {
	fingers = fingers || 1;
	var touch = this.isLongTouched(fingers, forceNew, mustEqual);
	if (touch) {
		if (!func || func(touch)) {
			if (nonExclusive) {
				this.deallocateTouch(touch);
			}
			return true;
		}
	}
	this.deallocateTouch(touch);
	return false;
}

/**
 * check that is the screen is been swiped or not.
 *   return true if there is some touch action just be done.
 *   
 * 
 * @static
 * @method checkSwiped
 * @param {Number} fingers Amount of fingers must be in same time.
 * @param {Boolean} forceNew Only check those touches not set as exclusive.
 * @param {Boolean} mustEqual The amount of finger on screen must equal to fingers. if forceNew is true, then the amount of non-excluded must be.
 * @param {Function} func function object that returns the requirements that the touch points must fulfill. in default, it is equal to function (touchPoints) { return true };
 * @param {Boolean} nonExclusive Fingers returned true will be exclusiive for other operations if this is set to true.
 * @return {Boolean} true if the action is performed.
 */
TouchInput.checkSwiped = function(fingers, forceNew, mustEqual, nonExclusive, func) {
	fingers = fingers || 1;
	var touch = this.isSwiped(fingers, forceNew, mustEqual);
	if (touch) {
		if (!func || func(touch)) {
			if (nonExclusive) {
				this.deallocateTouch(touch);
			}
			return true;
		}
	}
	this.deallocateTouch(touch);
	return false;
}

/**
 * check that is the screen is been flicked or not.
 *   return true if there is some touch action just be done.
 *   
 * 
 * @static
 * @method checkFlicked
 * @param {Number} fingers Amount of fingers must be in same time.
 * @param {Boolean} forceNew Only check those touches not set as exclusive.
 * @param {Boolean} mustEqual The amount of finger on screen must equal to fingers. if forceNew is true, then the amount of non-excluded must be.
 * @param {Function} func function object that returns the requirements that the touch points must fulfill. in default, it is equal to function (touchPoints) { return true };
 * @param {Boolean} nonExclusive Fingers returned true will be exclusiive for other operations if this is set to true.
 * @return {Boolean} true if the action is performed.
 */
TouchInput.checkFlicked = function(fingers, forceNew, mustEqual, nonExclusive, func) {
	fingers = fingers || 1;
	var touch = this.isFlicked(fingers, forceNew, mustEqual);
	if (touch) {
		if (!func || func(touch)) {
			if (nonExclusive) {
				this.deallocateTouch(touch);
			}
			return true;
		}
	}
	this.deallocateTouch(touch);
	return false;
}

/**
 * check that is the screen is been touching or not.
 *   return true if there is some touch action just be done.
 *   
 * 
 * @static
 * @method checkTouching
 * @param {Number} fingers Amount of fingers must be in same time.
 * @param {Boolean} forceNew Only check those touches not set as exclusive.
 * @param {Boolean} mustEqual The amount of finger on screen must equal to fingers. if forceNew is true, then the amount of non-excluded must be.
 * @param {Function} func function object that returns the requirements that the touch points must fulfill. in default, it is equal to function (touchPoints) { return true };
 * @param {Boolean} nonExclusive Fingers returned true will be exclusiive for other operations if this is set to true.
 * @return {Boolean} true if the action is performed.
 */
TouchInput.checkTouching = function(fingers, forceNew, mustEqual, nonExclusive, func) {
	fingers = fingers || 1;
	var touch = this.isTouching(fingers, forceNew, mustEqual);
	if (touch) {
		if (!func || func(touch)) {
			if (nonExclusive) {
				this.deallocateTouch(touch);
			}
			return true;
		}
	}
	this.deallocateTouch(touch);
	return false;
}

// TouchInput.deallocateTouch(touchPoint)
//   Let the specified touchPoint object available for other forceNew operations.
TouchInput.deallocateTouch = function(touchPoint) {
	if (!touchPoint) {
		return;
	}
	if (Array.isArray(touchPoint)) {
		for (var ii = 0; ii < touchPoint.length; ii++) {
			var t = touchPoint[ii];
			var i = this._kienReturnedTouchIdentifiers.indexOf(t._identifier);
			if (i >= 0) {
				this._kienReturnedTouchIdentifiers.splice(i, 1);
			}
		}
	} else {
		var i = this._kienReturnedTouchIdentifiers.indexOf(touchPoint._identifier);
		if (i >= 0) {
			this._kienReturnedTouchIdentifiers.splice(i, 1);
		}
	}
}

// TouchInput.isTouchAvailable(touchPoint)
//   Check if the touch action represented by this object is still active (touching) or not.
//   It is suggested to discard the TouchPoint object if this function is returning false,
//   as this object will not get any furthur update.
TouchInput.isTouchAvailable = function(touchPoint) {
	return this._kienTouchIdentifiers.indexOf(touchPoint._identifier) >= 0;
}

TouchInput.extractTouches = function(list, num, mustEqual) {
	if (mustEqual && list.length == num) {
		for (var p = 0; p < list.length; p++) {
			if (this._kienReturnedTouchIdentifiers.indexOf(list[p]._identifier) === -1) {
				this._kienReturnedTouchIdentifiers.push(list[p]._identifier);
			}
		}
		return list;
	} else if (!mustEqual && list.length >= num) {
		var nret = list.splice(0,num);
		for (var n = 0; n < nret.length; n++) {
			if (this._kienReturnedTouchIdentifiers.indexOf(nret[n]._identifier)) {
				this._kienReturnedTouchIdentifiers.push(nret[n]._identifier);
			}
		}
		return nret;
	}
	return null;
}

TouchInput.isMouseButtonTriggered = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isTriggered();
	}
	return false;
}

TouchInput.isMouseButtonReleased = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isReleased();
	}
	return false;
}

TouchInput.isMouseButtonPressed = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isPressed();
	}
	return false;
}

TouchInput.isMouseButtonDoubleClicked = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isDoubleClicked();
	}
	return false;
}

TouchInput.isMouseButtonNonDoubleTriggered = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isNonDoubleTriggered();
	}
	return false;
}

TouchInput.isMouseButtonRepeated = function(button) {
	if (typeof button === "string") {
		button = this._nameButtonConvert[button];
	}
	if (this._kienMouseProperties.buttons[button]) {
		return this._kienMouseProperties.buttons[button].isRepeated();
	}
	return false;
}

Kien.BetterTouchMouseInput.TouchInput_isCancelled = TouchInput.isCancelled;
TouchInput.isCancelled = function() {
    return this.isMouse() ? this.isMouseButtonTriggered("right") : this.isTouched(2, true, true);
};

Kien.BetterTouchMouseInput.TouchInput_isTriggered = TouchInput.isTriggered;
TouchInput.isTriggered = function() {
    return this.isMouse() ? this.isMouseButtonTriggered("left") : this.isTouched(1, true, true);
};

Kien.BetterTouchMouseInput.TouchInput_isRepeated = TouchInput.isRepeated;
TouchInput.isRepeated = function() {
    return this.isMouse() ? this.isMouseButtonRepeated("left") : this.isTouched(1, true, true);
};

TouchInput.isMoved = function() {
	return this._kienMouseProperties.cursorMoved;
}

TouchInput.isMouse = function() {
	return this._kienInputMode === 'mouse';
}

TouchInput.isTouch = function() {
	return this._kienInputMode === 'touch';
}

TouchInput.isKeyboard = function() {
	return this._kienInputMode === 'keyboard';
}

TouchInput.isInputModeChanged = function() {
	return this._kienModeChanged;
}

Object.defineProperty(TouchInput, 'x', {
    get: function() {
        return this._kienMouseProperties.cursorX;
    },
    configurable: true
});

/**
 * [read-only] The y coordinate on the canvas area of the latest touch event.
 *
 * @static
 * @property y
 * @type Number
 */
Object.defineProperty(TouchInput, 'y', {
    get: function() {
        return this._kienMouseProperties.cursorY;
    },
    configurable: true
});


//-----------------------------------------------------------------------------
// TouchData
//
// Static class that help you to examine touch datas.

function TouchData() {
    throw new Error('This is a static class');
}

/**
 * Return the direction of swipe action in degree between the sectionStart and sectionEnd.
 * 
 * @static
 * @method getSwipeDirection
 * @param {Array} data data array contains touch ponit data.
 * @param {Number} sectionStart starting index of data, or 0 if unspecified.
 * @param {Number} sectionEnd ending index of data, or data.length-1 if unspecified.
 * @return {Number} angle in degree.
 */
TouchData.getSwipeDirection = function(data, sectionStart, sectionEnd) {
	sectionStart = sectionStart || 0;
	sectionEnd = sectionEnd || data.length-1;

}



/**
 * return the percentage of matching between src and target.
 *   it will check how the lines represented by target is matching with src.
 * 
 * @static
 * @method compareRoutes
 * @return {Number} angle in degree.
 */

TouchData.maxDifferenceAllowed = 50;
TouchData.minimumDifferenceIgnored = 10;

TouchData.compareRoutes = function(src, target, width, height, interval) {
	interval = interval || 5;
	src = TouchData.preProcessRouteData(src);
	if (width && height) {
		src = TouchData.applySize(src, width, height);
	}
	var result = [];
	for (var i = 0; i < src.length; i++) {
		result[i] = {};
		result[i].dif = null;
		result[i].points = 0;
	}
	for (var i = interval; i < target.length; i += interval) {
		var point = target[i];
		var info = {
			'dif' : 999,
			'index' : -1
		}
		for (var si = 0; si < src.length; si++) {
			var line = src[si];
			// check if the point is in the range of line.
			if (point.x.between(line.startX,line.endX)) {
				// get the closest point on the line.
				var lp = {
					'x' : 0,
					'y' : 0
				}
				if (line.dydx != 0) {
					var a = -(1/line.dydx);
					var b = point.y - point.x * a;
					lp.x = - (b - (line.startY - line.startX * line.dydx)) / (a - line.dydx);
					lp.y = a * lp.x + b;
				} else {
					lp.x = point.x;
					lp.y = line.startY;
				}
				var dif = Math.max((TouchData.distanceBetween(lp.x,lp.y,point.x,point.y) - TouchData.minimumDifferenceIgnored) / TouchData.maxDifferenceAllowed, 0);
				if (dif < info.dif) {
					info.dif = dif;
					info.index = si;
				}
			} else
			// or it is near-enough to the line.
			 if (TouchData.distanceBetween(line.startX,line.startY,point.x,point.y) < TouchData.maxDifferenceAllowed ||
			 		TouchData.distanceBetween(line.endX,line.endY,point.x,point.y) < TouchData.maxDifferenceAllowed) {
			 	var dif = Math.min(TouchData.distanceBetween(line.startX,line.startY,point.x,point.y), TouchData.distanceBetween(line.endX,line.endY,point.x,point.y));
			 	dif = Math.max((dif - TouchData.minimumDifferenceIgnored)  / TouchData.maxDifferenceAllowed, 0);
				if (dif < info.dif) {
					info.dif = dif;
					info.index = si;
				}
			}
		}
		if (info.index >= 0) {
			var obj = result[info.index];
			obj.dif = (obj.dif * obj.points + info.dif) / (obj.points + 1)
			obj.points++;
		}
	}
	var tdif = 0;
	var tp = 0;
	var o = false;
	for (var n = 0; n < result.length; n++) {
		if (result[n].dif !== null) {
			tdif += result[n].dif * result[n].points;
			tp += result[n].points;
		} else {
			o = true;
			break;
		}
	}
	if (!o) {
		result.available = true;
		result.average = tdif / tp;
	} else {
		result.available = false;
	}
	return result;
}

TouchData.distanceBetween = function(x,y,w,z) {
	return Math.sqrt((w-x)*(w-x) + (z-y)*(z-y));
}

TouchData.applySize = function(src, width, height) {
	result = [];
	for (var n = 0; n < src.length; n++) {
		var obj = src[n];
		var nobj = {};
		nobj.startX = obj.startX * width;
		nobj.endX = obj.endX * width;
		nobj.startY = obj.startY * height;
		nobj.endY = obj.endY * height;
		nobj.dydx = obj.dydx * (height/width);
		if (obj.ddydxx) {
			nobj.ddydxx = obj.ddydxx * ((height/width) / width);
		}
		nobj.distance = obj.distance * Math.sqrt(width*width + height*height);
		nobj.width = width;
		nobj.height = height;
		result[n] = nobj;
	}
	return result;
}

TouchData.preProcessRouteData = function(src) {
	var result = [];
	for (var n = 0; n < src.length; n++) {
		var obj = src[n];
		var nobj = {};
		nobj.endX = obj.endX;
		nobj.startX = obj.startX;
		nobj.endY = obj.endY;
		nobj.startY = obj.startY;
		if (!obj.dydx) {
			if (!(obj.endX == obj.startX)) {
				nobj.dydx = (obj.endY-obj.startY) / (obj.endX - obj.startX);
			} else if (!(obj.endY == obj.startY)) {
				nobj.dydx = (obj.endX - obj.startY) / (obj.endY-obj.startY);
				nobj.dxdy = true;
			}
		}
		nobj.distance = Math.sqrt(Math.pow(obj.endX-obj.startX, 2) + Math.pow(obj.endY - obj.startY, 2));
		result[n] = nobj;
	}
	return result;
}

//-----------------------------------------------------------------------------
// Game_Temp
//
// The game object class for temporary data that is not included in save data.

Kien.BetterTouchMouseInput.Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
	Kien.BetterTouchMouseInput.Game_Temp_initialize.apply(this, arguments);
	this._mapTouchPoint = null;

};

Kien.BetterTouchMouseInput.Game_Temp_isDestinationValid = Game_Temp.prototype.isDestinationValid;
Game_Temp.prototype.isDestinationValid = function() {
    return Kien.BetterTouchMouseInput.Game_Temp_isDestinationValid.apply(this, arguments) || this._mapTouchPoint != null;
};

Game_Temp.prototype.getTouchPoint = function() {
	return this._mapTouchPoint;
}

Kien.BetterTouchMouseInput.Game_Temp_destinationX = Game_Temp.prototype.destinationX;
Game_Temp.prototype.destinationX = function() {
	if (!!this._mapTouchPoint) {
		if (this._mapTouchPoint.isTouching()) {
			return $gameMap.canvasToMapX(this._mapTouchPoint.x);
		} else {
			this.setDestination($gameMap.canvasToMapX(this._mapTouchPoint.x), $gameMap.canvasToMapY(this._mapTouchPoint.y));
			this._mapTouchPoint = null;
			return Kien.BetterTouchMouseInput.Game_Temp_destinationX.apply(this, arguments);
		}
	} else {
		return Kien.BetterTouchMouseInput.Game_Temp_destinationX.apply(this, arguments);
	}
};

Kien.BetterTouchMouseInput.Game_Temp_destinationY = Game_Temp.prototype.destinationY;
Game_Temp.prototype.destinationY = function() {
	if (!!this._mapTouchPoint) {
		if (this._mapTouchPoint.isTouching()) {
			return $gameMap.canvasToMapY(this._mapTouchPoint.y)
		} else {
			this.setDestination($gameMap.canvasToMapX(this._mapTouchPoint.x), $gameMap.canvasToMapY(this._mapTouchPoint.y));
			this._mapTouchPoint = null;
			return Kien.BetterTouchMouseInput.Game_Temp_destinationY.apply(this, arguments);
		}
	} else {
		return Kien.BetterTouchMouseInput.Game_Temp_destinationY.apply(this, arguments);
	}
};

Kien.BetterTouchMouseInput.Game_Temp_clearDestination = Game_Temp.prototype.clearDestination;
Game_Temp.prototype.clearDestination = function() {
	Kien.BetterTouchMouseInput.Game_Temp_clearDestination.apply(this, arguments);
	this._mapTouchPoint = null;
};

//-----------------------------------------------------------------------------
// Sprite_Button
//
// The sprite for displaying a button.
// As a sample for how this TouchPoint system works.

Kien.BetterTouchMouseInput.Sprite_Button_initialize = Sprite_Button.prototype.initialize;
Sprite_Button.prototype.initialize = function() {
    Kien.BetterTouchMouseInput.Sprite_Button_initialize.apply(this, arguments);
    this._touchPoint = null;
};

Kien.BetterTouchMouseInput.Sprite_Button_updateFrame = Sprite_Button.prototype.updateFrame;
Sprite_Button.prototype.updateFrame = function() {
	if (TouchInput.isMouse()){
		return Kien.BetterTouchMouseInput.Sprite_Button_updateFrame.apply(this, arguments);
	}
    var frame;
    if (this._touchPoint) {
        frame = this._hotFrame;
    } else {
        frame = this._coldFrame;
    }
    if (frame) {
        this.setFrame(frame.x, frame.y, frame.width, frame.height);
    }
};

Kien.BetterTouchMouseInput.Sprite_Button_processTouch = Sprite_Button.prototype.processTouch;
Sprite_Button.prototype.processTouch = function() {
    if (this.isActive()) {
    	if (TouchInput.isMouse()) {
    		Kien.BetterTouchMouseInput.Sprite_Button_processTouch.apply(this, arguments);
    	} else if (this._touching) {
            this._touching = false;
            this.callClickHandler();
            return;
    	}
    	if (!this._touchPoint) {
    	// Retrieve all TouchPoint currently exists.
	    	var arrs = TouchInput.isTouching(0, true);
	    	if (arrs) {
	    		// Check if the TouchPoint is on this sprite.
	    		for (var n = 0; n < arrs.length; n++) {
	    			if (this._touchPoint) {
	    				// When we had found one, then we don't need any more.
		    			TouchInput.deallocateTouch(arrs[n]);
	    			} else {
		    			if (this.isButtonTouched(arrs[n])) {
		    				this._touchPoint = arrs[n];
		    			} else {
		    				// deallocate the TouchPoints that is not suitable;
			    			TouchInput.deallocateTouch(arrs[n]);
		    			}
	    			}
	    		}

	    	}
    	} else {
    		// if the touch is released and the point is still inside the sprite;
            if (!this._touchPoint.isTouching() && this.isButtonTouched(this._touchPoint)) {
            	// as we don't want this touch trigger events any furthur, so don't deallocate it. 
            	this._touchPoint = null;
                this.callClickHandler();
            } else if (!this.isButtonTouched(this._touchPoint)) {
            	// If it had leave the sprite, then deallocate it to allow other event triggered.
            	TouchInput.deallocateTouch(this._touchPoint);
            	this._touchPoint = null;
            }
        }
    } else {
        if (this._touchPoint) {
        	TouchInput.deallocateTouch(this._touchPoint);
        	this._touchPoint = null;
        }
    }
};

Sprite_Button.prototype.isButtonTouched = function(point) {
	//DebugDiv.clear();
    var x = this.canvasToLocalX(point ? point.x : TouchInput.x);
    var y = this.canvasToLocalY(point ? point.y : TouchInput.y);
    //DebugDiv.addString("x: " + x + ", y: " + y);
    return x >= 0 && y >= 0 && x < (this.width * this.scale.x) && y < (this.height * this.scale.y);
};

//-----------------------------------------------------------------------------
// Sprite_UIButton
//
// The sprite for displaying a button with specified background and string.

function Sprite_UIButton() {
	this.initialize.apply(this, arguments);
}

Sprite_UIButton.prototype = Object.create(Sprite_Button.prototype);
Sprite_UIButton.prototype.constructor = Sprite_UIButton;

Sprite_UIButton.prototype.initialize = function() {
	Sprite_Button.prototype.initialize.apply(this, arguments);
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;
	this._buttonText = null;
    this.defaultScale = new Point();
    this.defaultScale.x = 1;
    this.defaultScale.y = 1;
    this._mode = "none";
    this._backgroundName = "buttonTemplate";
	this.bitmap = ImageManager.loadSystem(this._backgroundName);
}

Sprite_UIButton.prototype.select = function() {
    this._mode = "selected";
    this.refreshBitmap();
}

Sprite_UIButton.prototype.revert = function() {
    this._mode = "none";
    this.refreshBitmap();
}

Sprite_UIButton.prototype.lock = function() {
    this._mode = "locked";
    this.refreshBitmap();
}

Sprite_UIButton.prototype.selected = function() {
	return this._mode == "selected";
}

Sprite_UIButton.prototype.locked = function() {
	return this._mode == "locked";
}

Sprite_UIButton.prototype.refreshBitmap = function() {
    if (this._mode == "selected") {
        this.bitmap = ImageManager.loadSystem(this._backgroundName + "Selected");
    } else if (this._mode == "locked") {
        this.bitmap = ImageManager.loadSystem(this._backgroundName + "Locked");
    } else {
        this.bitmap = ImageManager.loadSystem(this._backgroundName);
    }
}

Sprite_UIButton.prototype.setTextBitmap = function(bitmap) {
	this._buttonText = null;
	this.createTextSprite();
	this._textSprite.bitmap = bitmap;
	this.bitmap.addLoadListener(this.refreshTextScale.bind(this));
}

Sprite_UIButton.prototype.setText = function(string) {
	if (string != this._buttonText) {
		this._buttonText = string;
		this.createTextSprite();
	}
}

Sprite_UIButton.prototype.setPressHandler = function(handler) {
	this._pressHandler = handler;
}

Sprite_UIButton.prototype.callPressHandler = function() {
    if (this._pressHandler) {
        this._pressHandler();
    }
};

Sprite_UIButton.prototype.setTriggerHandler = function(handler) {
	this._triggerHandler = handler;
}

Sprite_UIButton.prototype.callTriggerHandler = function() {
    if (this._triggerHandler) {
        this._triggerHandler();
    } else {
    	this.callPressHandler();
    }
};

Sprite_UIButton.prototype.processTouch = function() {
    if (this.isActive()) {
    	if (TouchInput.isMouse()) {
    		if (TouchInput.isTriggered() && this.isButtonTouched()) {
    			this._touching = true;
    			this.callTriggerHandler();
    		}
    		if (this._touching) {
    			if (TouchInput.isReleased() || !this.isButtonTouched()) {
    				this._touching = false;
    				if (TouchInput.isReleased()) {
    					this.callClickHandler();
    				}
    			} else if (TouchInput.isPressed() && this.isButtonTouched()) {
    				this.callPressHandler();
    			}
    		}
    	} else if (this._touching) {
            this._touching = false;
            this.callClickHandler();
            return;
    	}
    	if (!this._touchPoint) {
    	// Retrieve all TouchPoint currently exists.
	    	var arrs = TouchInput.isTouching(0, true, true);
	    	if (arrs) {
	    		// Check if the TouchPoint is on this sprite.
	    		for (var n = 0; n < arrs.length; n++) {
	    			if (this._touchPoint) {
	    				// When we had found one, then we don't need any more.
		    			TouchInput.deallocateTouch(arrs[n]);
	    			} else {
		    			this._touchPoint = arrs[n];
		    			if (this.isButtonTouched(this._touchPoint)) {
		    				continue;
		    			}
		    			this._touchPoint = null;
	    				// deallocate the TouchPoints that is not suitable;
		    			TouchInput.deallocateTouch(arrs[n]);
	    			}
	    		}
	    		if (this._touchPoint) {
		    		this.callTriggerHandler();
	    		}
	    	}
    	} else {
    		// if the touch is released and the point is still inside the sprite;
            if (this.isButtonTouched(this._touchPoint)) {
            	// as we don't want this touch trigger events any furthur, so don't deallocate it. 
            	if (!this._touchPoint.isTouching()) {
	            	this._touchPoint = null;
	                this.callClickHandler();
            	} else {
            		this.callPressHandler();
            	}
            } else if (!this.isButtonTouched()) {
            	// If it had leave the sprite, then deallocate it to allow other event triggered.
            	TouchInput.deallocateTouch(this._touchPoint);
            	this._touchPoint = null;
            }
        }
    } else {
		this._touching = false;
        if (this._touchPoint) {
        	TouchInput.deallocateTouch(this._touchPoint);
        	this._touchPoint = null;
        }
    }
};


Sprite_UIButton.prototype.createTextSprite = function() {
	if (!this._textSprite) {
		this._textSprite = new Sprite();
		this._textSprite.anchor.x = 0.5;
		this._textSprite.anchor.y = 0.5;
		this.addChild(this._textSprite);
	}
	if (this._buttonText) {
		var ts = Kien.lib.calculateTextSizeEx(this._buttonText);
		var bitmap = new Bitmap(ts.width, ts.height);
		Kien.lib.setBitmapFontSetting(bitmap);
		Kien.lib.drawTextExToBitmapCenter(this._buttonText, bitmap);
		this._textSprite.bitmap = bitmap;
		this.bitmap.addLoadListener(this.refreshTextScale.bind(this));
	} else {
		this._textSprite.bitmap = null;
		this._textSprite.scale.x = 1;
		this._textSprite.scale.y = 1;
	}
}

Sprite_UIButton.prototype.refreshTextScale = function() {
	var bitmap = this._textSprite.bitmap;
	if (bitmap.width > this.bitmap.width || bitmap.height > this.bitmap.height) {
		var hratio = this.bitmap.width / bitmap.width;
		var vratio = this.bitmap.height / bitmap.height;
		this._textSprite.scale.x = Math.min(hratio, vratio);
		this._textSprite.scale.y = Math.min(hratio, vratio);
	} else {
		this._textSprite.scale.x = 1;
		this._textSprite.scale.y = 1;
	}
}

Sprite_UIButton.prototype.updateFrame = function() {
    var frame;
    if (this._touchPoint || (TouchInput.isMouse() && this._touching)) {
    	this.scale.x = this.defaultScale.x * 0.8;
    	this.scale.y = this.defaultScale.y * 0.8;
    } else {
    	this.scale.x = this.defaultScale.x;
    	this.scale.y = this.defaultScale.y;
    }
};

Sprite_UIButton.prototype.canvasToLocalX = function(x) {
    var node = this;
    x -= node.x;
    x += node.anchor.x * node.width * node.defaultScale.x;
    node = node.parent;
    while (node) {
        x -= node.x;
        if (node.anchor) {
        	x += node.anchor.x * node.width * node.scale.x;
        }
        node = node.parent;
    }
    return x;
};

Sprite_UIButton.prototype.canvasToLocalY = function(y) {
    var node = this;
    y -= node.y;
    y += node.anchor.y * node.height * node.defaultScale.y;
    node = node.parent;
    while (node) {
        y -= node.y;
        if (node.anchor) {
        	y += node.anchor.y * node.height * node.scale.y;
        }
        node = node.parent;
    }
    return y;
};

Sprite_UIButton.prototype.isButtonTouched = function(point) {
    //DebugDiv.clear();
    var x = this.canvasToLocalX(point ? point.x : TouchInput.x);
    var y = this.canvasToLocalY(point ? point.y : TouchInput.y);
    //DebugDiv.addString("x: " + x + ", y: " + y);
    return x >= 0 && y >= 0 && x < (this.width * this.defaultScale.x) && y < (this.height * this.defaultScale.y);
};

Sprite_UIButton.prototype.setX = function(x) {
	this.x = x + this.bitmap.width * this.anchor.x * this.defaultScale.x;
}

Sprite_UIButton.prototype.setY = function(y) {
	this.y = y + this.bitmap.height * this.anchor.y * this.defaultScale.y;
}

//-----------------------------------------------------------------------------
// Window_Button
//
// Button that inherit from Window

function Window_Button() {
	this.initialize.apply(this, arguments);
}

Window_Button.prototype = Object.create(Window_Base.prototype);
Window_Button.prototype.constructor = Window_Button;

Window_Button.prototype.initialize = function(x, y, width, height) {
	x = x || 0;
	y = y || 0;
	width = width || 144;
	height = height || 72;
    this._mode = "none";
    this._touching = false;
    this._touchPoint = null;
    this._standardFontSize = 28;
	Window_Base.prototype.initialize.call(this, x, y, width, height);
	this.origin.x = 0.5;
	this.origin.y = 0.5;
}

Window_Button.prototype.standardPadding = function() {
    return 6;
};

Window_Button.prototype.standardFontSize = function() {
    return this._standardFontSize;
};

Window_Button.prototype.select = function() {
    this._mode = "selected";
    this.refreshWindowskin();
}

Window_Button.prototype.revert = function() {
    this._mode = "none";
    this.refreshWindowskin();
}

Window_Button.prototype.lock = function() {
    this._mode = "locked";
    this.refreshWindowskin();
}

Window_Button.prototype.selected = function() {
	return this._mode == "selected";
}

Window_Button.prototype.locked = function() {
	return this._mode == "locked";
}

Window_Button.prototype.refreshWindowskin = function() {
    if (this._mode == "selected") {
        this.windowskin = ImageManager.loadSystem("WindowSelected");
    } else if (this._mode == "locked") {
        this.windowskin = ImageManager.loadSystem("WindowLocked");
    } else {
    	this.windowskin = ImageManager.loadSystem("Window");
    }
}

Window_Button.prototype.processTouch = function() {
    if (this.isActive()) {
    	if (TouchInput.isMouse()) {
    		if (TouchInput.isTriggered() && this.isButtonTouched()) {
    			this._touching = true;
    			this.callTriggerHandler();
    		}
    		if (this._touching) {
    			if (TouchInput.isReleased() || !this.isButtonTouched()) {
    				this._touching = false;
    				if (TouchInput.isReleased()) {
    					this.callClickHandler();
    				}
    			} else if (TouchInput.isPressed() && this.isButtonTouched()) {
    				this.callPressHandler();
    			}
    		}
    	} else if (this._touching) {
            this._touching = false;
            this.callClickHandler();
            return;
    	}
    	if (!this._touchPoint) {
    	// Retrieve all TouchPoint currently exists.
	    	var arrs = TouchInput.isTouching(0, true, true);
	    	if (arrs) {
	    		// Check if the TouchPoint is on this sprite.
	    		for (var n = 0; n < arrs.length; n++) {
	    			if (this._touchPoint) {
	    				// When we had found one, then we don't need any more.
		    			TouchInput.deallocateTouch(arrs[n]);
	    			} else {
		    			this._touchPoint = arrs[n];
		    			if (this.isButtonTouched(this._touchPoint)) {
		    				continue;
		    			}
		    			this._touchPoint = null;
	    				// deallocate the TouchPoints that is not suitable;
		    			TouchInput.deallocateTouch(arrs[n]);
	    			}
	    		}
	    		if (this._touchPoint) {
		    		this.callTriggerHandler();
	    		}
	    	}
    	} else {
    		// if the touch is released and the point is still inside the sprite;
            if (this.isButtonTouched(this._touchPoint)) {
            	// as we don't want this touch trigger events any furthur, so don't deallocate it. 
            	if (!this._touchPoint.isTouching()) {
	            	this._touchPoint = null;
	                this.callClickHandler();
            	} else {
            		this.callPressHandler();
            	}
            } else if (!this.isButtonTouched()) {
            	// If it had leave the sprite, then deallocate it to allow other event triggered.
            	TouchInput.deallocateTouch(this._touchPoint);
            	this._touchPoint = null;
            }
        }
    } else {
		this._touching = false;
        if (this._touchPoint) {
        	TouchInput.deallocateTouch(this._touchPoint);
        	this._touchPoint = null;
        }
    }
};

Window_Button.prototype.update = function() {
	Window_Base.prototype.update.apply(this, arguments);
	this.processTouch();
	this.updateScale();
}

Window_Button.prototype.isActive = function() {
    var node = this;
    while (node) {
        if (!node.visible) {
            return false;
        }
        node = node.parent;
    }
    return true;
};

Window_Button.prototype.canvasToLocalX = function(x) {
    var node = this;
    while (node) {
        x -= node.getX ? node.getX() : node.x;
        if (node.anchor) {
        	x += node.anchor.x * node.width;
        }
        node = node.parent;
    }
    return x;
};

Window_Button.prototype.canvasToLocalY = function(y) {
    var node = this;
    while (node) {
        y -= node.getY ? node.getY() : node.y;
        if (node.anchor) {
        	y += node.anchor.y * node.height;
        }
        node = node.parent;
    }
    return y;
};

Window_Button.prototype.updateScale = function() {
    if (this._touchPoint || (TouchInput.isMouse() && this._touching)) {
    	if (this.scale.x != 0.8) {
	    	this.scale.x = 0.8;
	    	this.scale.y = 0.8;
	    	this.x += this.width * 0.1;
	    	this.y += this.height * 0.1;
    	}
    } else {
    	if (this.scale.x != 1) {
	    	this.scale.x = 1;
	    	this.scale.y = 1;
	    	this.x -= this.width * 0.1;
	    	this.y -= this.height * 0.1;
    	}
    }
};

Window_Button.prototype.isButtonTouched = function(point) {
    //DebugDiv.clear();
    var x = this.canvasToLocalX(point ? point.x : TouchInput.x);
    var y = this.canvasToLocalY(point ? point.y : TouchInput.y);
    //DebugDiv.addString("x: " + x + ", y: " + y);
    return x >= 0 && y >= 0 && x < (this.width) && y < (this.height);
};

Window_Button.prototype.setClickHandler = function(method) {
    this._clickHandler = method;
};

Window_Button.prototype.callClickHandler = function() {
    if (this._clickHandler) {
        this._clickHandler();
    }
};

Window_Button.prototype.setPressHandler = function(handler) {
	this._pressHandler = handler;
}

Window_Button.prototype.callPressHandler = function() {
    if (this._pressHandler) {
        this._pressHandler();
    }
};

Window_Button.prototype.setTriggerHandler = function(handler) {
	this._triggerHandler = handler;
}

Window_Button.prototype.callTriggerHandler = function() {
    if (this._triggerHandler) {
        this._triggerHandler();
    } else {
    	this.callPressHandler();
    }
};

Window_Button.prototype.setText = function(text, align) {
	align = align || 'center';
	this.contents.clear();
	var y = (this.contents.height - this.lineHeight()) / 2;
	this.drawText(text,0,y,this.contents.width,align);
}

Window_Button.prototype.setX = function(x) {
	if (this._touching) {
		this.x = x  + this.width * 0.1;
	} else {
		this.x = x;
	}
}

Window_Button.prototype.setY = function(y) {
	if (this._touching) {
		this.y = y  + this.height * 0.1;
	} else {
		this.y = y;
	}
}

Window_Button.prototype.getX = function(x) {
	if (this._touching) {
		return this.x - this.width * 0.1;
	} else {
		return this.x;
	}
}

Window_Button.prototype.getY = function(y) {
	if (this._touching) {
		return this.y  - this.height * 0.1;
	} else {
		return this.y;
	}
}
//-----------------------------------------------------------------------------
// Window_SimpleButton
//
// Button that don't do anything by itself.

function Window_SimpleButton() {
	this.initialize.apply(this, arguments);
}

Window_SimpleButton.prototype = Object.create(Window_Button.prototype);
Window_SimpleButton.prototype.constructor = Window_SimpleButton;

Window_SimpleButton.prototype.processTouch = function() {
};

Window_SimpleButton.prototype.updateScale = function() {
    if (this._touching) {
    	if (this.scale.x != 0.8) {
	    	this.scale.x = 0.8;
	    	this.scale.y = 0.8;
	    	this.x += this.width * 0.1;
	    	this.y += this.height * 0.1;
    	}
    } else {
    	if (this.scale.x != 1) {
	    	this.scale.x = 1;
	    	this.scale.y = 1;
	    	this.x -= this.width * 0.1;
	    	this.y -= this.height * 0.1;
    	}
    }
};

//-----------------------------------------------------------------------------
// Sprite_Path
//
// The sprite for displaying the path of points.

function Sprite_Path() {
	this.initialize.apply(this, arguments);
}

Sprite_Path.prototype = Object.create(Sprite_Base.prototype);
Sprite_Path.prototype.constructor = Sprite_Path;

Sprite_Path.prototype.initialize = function(path, width, height) {
	Sprite_Base.prototype.initialize.call(this);
	this._color = "rgba(255,255,255,0.5)";
	if (path) {
		this.setPath(path, width, height);
	}
}

Sprite_Path.prototype.setPath = function(path, width, height) {
	this._pathWidth = width;
	this._pathHeight = height;
	this._path = path;
	this.refresh();
}

Sprite_Path.prototype.refresh = function() {
	this.createBitmap();
	this.drawPath();
}

Sprite_Path.prototype.createBitmap = function() {
	if (this._pathWidth && this._pathHeight && !this.bitmap) {
		this.bitmap = new Bitmap(this._pathWidth, this._pathHeight);
	}
}

Sprite_Path.prototype.drawPath = function() {
	if (this._path) {
		this.bitmap.clear();
		var lp = this._path[0];
		for (var i = 1; i < this._path.length; i++) {
			var cp = this._path[i];
			this.bitmap.drawLine(lp.x,lp.y,cp.x,cp.y, this._color, 3);
			lp = cp;
		}
	}
}

//-----------------------------------------------------------------------------
// Window_Selectable
//
// The window class with cursor movement and scroll functions.

Kien.BetterTouchMouseInput.Window_Selectable_initialize = Window_Selectable.prototype.initialize;
Window_Selectable.prototype.initialize = function(x, y, width, height) {
	this._touchPoint = null;
	this._touchIndex = -1;
	this._touchWait = 0;
	this._allowNonActive = false;
	this._allowNonActiveCancel = false;
	this._mouseClickIndex = -1;
	Kien.BetterTouchMouseInput.Window_Selectable_initialize.apply(this, arguments);
};

Window_Selectable.prototype.isVisibleAndActiveOrNonAllowNonActive = function(isCancel) {
	return this.isOpen() && this.visible &&  (isCancel ? (this.active || this._allowNonActiveCancel) : (this.active || this._allowNonActive));
}

Kien.BetterTouchMouseInput.Window_Selectable_processTouch = Window_Selectable.prototype.processTouch;
Window_Selectable.prototype.processTouch = function() {
	if (TouchInput.isMouse()) {
		if (this.isVisibleAndActiveOrNonAllowNonActive(false)) {
			var x = TouchInput.x;
			var y = TouchInput.y;
			if (this.isTouchedInsideFrame({"x" : x, "y" : y})) {
				if (TouchInput.isMoved()) {
					var lastIndex = this.index();
					var hitIndex = this.hitTest(this.canvasToLocalX(x), this.canvasToLocalY(y));
					if (this.isCursorMovable() && hitIndex >= 0 && hitIndex !== this.index()) {
						this.select(hitIndex);
						SoundManager.playCursor();
					}
				}
				if (TouchInput.isMouseButtonTriggered("left")) {
					var hitIndex = this.hitTest(this.canvasToLocalX(x), this.canvasToLocalY(y));
					if (this.index() === hitIndex) {
						this._mouseClickIndex = this.index();
					}
				}
				if (TouchInput.isMouseButtonReleased("left")) {
					var hitIndex = this.hitTest(this.canvasToLocalX(x), this.canvasToLocalY(y));
					if (hitIndex >= 0 && hitIndex === this._mouseClickIndex) {
						if (this.isTouchOkEnabled()) {
							this.processOk();
						}
					}
					this._mouseClickIndex = -1;
				}
			}
			if (TouchInput.isMouseButtonReleased("right") && this.isVisibleAndActiveOrNonAllowNonActive(true)) {
	            if (this.isCancelEnabled()) {
	                this.processCancel();
	            }
			}
		} else {
			this._mouseClickIndex = -1;
		}
		return;
	}
    if (this.isVisibleAndActiveOrNonAllowNonActive(false)) {
    	if (!this._touchPoint) {
    		if (this.isCancelEnabled() && TouchInput.isTouched(2,true,true) && this.isVisibleAndActiveOrNonAllowNonActive(true)) {
	    		this.processCancel();
	    		return;
	   		}
	   		if (this._touchWait > 0) {
	   			this._touchWait--;
	   			return;
	   		}
    		var ret = TouchInput.isTouching(0, true);
    		if (ret) {
	    		for (var n = 0; n < ret.length; n++) {
	    			var touch = ret[n];
	    			if (this._touchPoint) {
	    				TouchInput.deallocateTouch(touch);
	    			} else if (this.isTouchedInsideFrame(touch)) {
	    				this._touchPoint = touch;
	    				this._touchIndex = this.index();
	    			} else {
	    				TouchInput.deallocateTouch(touch);
	    			}
	    		}
    		}
    		if (this._touchPoint) {
    			this.onTouch(true);
    		}
    	} else if (this._touchPoint) {
    		if (this._touchPoint.isTouching()) {
    			this.onTouch(false);
    		} else {
    			if (this._touchPoint.isTouched()) {
    				if (this.isTouchOkEnabled() && this.index() == this._touchIndex) {
    					this.processOk();
    				} else {
    					TouchInput.deallocateTouch(this._touchPoint);
    				}
    			} else if (this._touchPoint.isFlicked()) {
    				switch (this._touchPoint.getSwipeDirection()) {
    					case 2:
    					case 6:
    						this.onTouchPagedown();
    						break;
    					case 4:
    					case 8:
    						this.onTouchPageup();
    				}
    			} else {
    				TouchInput.deallocateTouch(this._touchPoint);
    			}
    			this._touchPoint = null;
    			this._touchWait = 6;
    		}
    	}
    } else {
        this._touchPoint = null;
        this._touchIndex = -1;
    }
};

Window_Selectable.prototype.onTouchPagedown = function() {
	if (this.isHandled('pagedown')) {
		this.processPagedown();
	} else {
		this.cursorPagedown();
	}
}

Window_Selectable.prototype.onTouchPageup = function() {
	if (this.isHandled('pageup')) {
		this.processPageup();
	} else {
		this.cursorPageup();
	}
}

Kien.BetterTouchMouseInput.Window_Selectable_onTouch = Window_Selectable.prototype.onTouch;
Window_Selectable.prototype.onTouch = function(triggered) {
	if (TouchInput.isMouse()) {  
		Kien.BetterTouchMouseInput.Window_Selectable_onTouch.apply(this, arguments);
		return;
	}
    var lastIndex = this.index();
    var x = this.canvasToLocalX(this._touchPoint.x);
    var y = this.canvasToLocalY(this._touchPoint.y);
    var hitIndex = this.hitTest(x, y);
    if (hitIndex >= 0) {
    	if (this.isCursorMovable()) {
            this.select(hitIndex);
        }
    } else if (this._stayCount >= 10) {
        if (y < this.padding) {
            this.cursorUp();
        } else if (y >= this.height - this.padding) {
            this.cursorDown();
        }
    }
    if (this.index() !== lastIndex) {
        SoundManager.playCursor();
    }
};

Window_Selectable.prototype.isTouchedInsideFrame = function(point) {
    var x = this.canvasToLocalX(point ? point.x : TouchInput.x);
    var y = this.canvasToLocalY(point ? point.y : TouchInput.y);
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Window_ShopNumber.prototype.isTouchOkEnabled = function() {
	return false;
}

//-----------------------------------------------------------------------------
// Window_Message
//
// The window for displaying text messages.

Window_Message.prototype.isTriggered = function() {
    return (Input.isRepeated('ok') || Input.isRepeated('cancel') ||
            TouchInput.isRepeated());
};

//-----------------------------------------------------------------------------
// Scene_Map
//
// The scene class of the map screen.

Kien.BetterTouchMouseInput.Scene_Map_initialize = Scene_Map.prototype.initialize;
Scene_Map.prototype.initialize = function() {
	Kien.BetterTouchMouseInput.Scene_Map_initialize.apply(this, arguments);
	this._touchPoint = null;
};

Kien.BetterTouchMouseInput.Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
	Kien.BetterTouchMouseInput.Scene_Map_createDisplayObjects.apply(this, arguments);
	this._menuButton = new Sprite_UIButton();
	this._menuButton.setText("メニュー")
	this._menuButton.x = 76;
	this._menuButton.y = Graphics.height - 40;
	this._menuButton.setClickHandler((function() {this.menuCalling = true}).bind(this));
	this.addChild(this._menuButton);
};

Kien.BetterTouchMouseInput.Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
	this._menuButton.visible = this.isMenuEnabled() && !SceneManager.isSceneChanging();
	Kien.BetterTouchMouseInput.Scene_Map_update.apply(this, arguments);
};

Kien.BetterTouchMouseInput.Scene_Map_updateDestination = Scene_Map.prototype.updateDestination;
Scene_Map.prototype.updateDestination = function() {
	Kien.BetterTouchMouseInput.Scene_Map_updateDestination.apply(this, arguments);
    if (!this.isMapTouchOk()) {
    	this._touchPoint = null;
    }
};

Kien.BetterTouchMouseInput.Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function() {
	if (TouchInput.isMouse()) {
		if (!this._menuButton.isButtonTouched()) {
			Kien.BetterTouchMouseInput.Scene_Map_processMapTouch.apply(this, arguments);
		}
		return;
	}
	if ($gameMap.isEventRunning()) {
		this._touchPoint = null;
		$gameTemp.clearDestination();
		return;
	}
	if (!this._touchPoint) {
		var touchPoints = TouchInput.isTouching(0,true,true);
		if (touchPoints) {
			for (var i = 0; i < touchPoints.length; i++) {
				if (this._touchPoint) {
					TouchInput.deallocateTouch(touchPoints[i]);
				} else if (!this._menuButton.isButtonTouched(touchPoints[i])) {
					this._touchPoint = touchPoints[i];
				} else {
					TouchInput.deallocateTouch(touchPoints[i]);
				}
			}
		}
		if (this._touchPoint) {
			$gameTemp._mapTouchPoint = this._touchPoint;
		}
	}
	if (this._touchPoint) {
		if (!this._touchPoint.isTouching()) {
			TouchInput.deallocateTouch(this._touchPoint);
			this._touchPoint = null;
		} else {
			$gameTemp._mapTouchPoint = this._touchPoint;
		}
	}
};

Scene_Map.prototype.isMenuCalled = function() {
    return Input.isTriggered('menu') || TouchInput.isMouseButtonReleased("right");
};
//-----------------------------------------------------------------------------
// Scene_Shop
//
// The scene class of the shop screen.

Scene_Shop.prototype.createCommandWindow = function() {
    this._commandWindow = new Window_ShopCommand(this._goldWindow.x, this._purchaseOnly);
    this._commandWindow.y = this._helpWindow.height;
    this._commandWindow.setHandler('buy',    this.commandBuy.bind(this));
    this._commandWindow.setHandler('sell',   this.commandSell.bind(this));
    this._commandWindow.setHandler('cancel', this.popScene.bind(this));
	this._commandWindow._allowNonActive = true;
    this.addWindow(this._commandWindow);
};

Scene_Shop.prototype.createCategoryWindow = function() {
    this._categoryWindow = new Window_ItemCategory();
    this._categoryWindow.setHelpWindow(this._helpWindow);
    this._categoryWindow.y = this._dummyWindow.y;
    this._categoryWindow.hide();
    this._categoryWindow.deactivate();
    this._categoryWindow.setHandler('ok',     this.onCategoryOk.bind(this));
    this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
    this._categoryWindow._allowNonActive = true;
    this.addWindow(this._categoryWindow);
};

Kien.BetterTouchMouseInput.Scene_Shop_commandBuy = Scene_Shop.prototype.commandBuy;
Scene_Shop.prototype.commandBuy = function() {
	if (this._numberWindow.avtive) {
    	this._numberWindow.deactivate();
    	this.endNumberInput();
	}
	if (this._sellWindow.active) {
		this._sellWindow.deactivate();
		this.onSellCancel();
	}
	if (this._categoryWindow.active) {
		this._categoryWindow.deactivate();
		this.onCategoryCancel();
	}
	Kien.BetterTouchMouseInput.Scene_Shop_commandBuy.apply(this, arguments);
	this._currentSymbol = 'buy';
};

Kien.BetterTouchMouseInput.Scene_Shop_commandSell = Scene_Shop.prototype.commandSell;
Scene_Shop.prototype.commandSell = function() {
	if (this._numberWindow.active) {
		this._numberWindow.deactivate();
    	this.endNumberInput();
	}
	if (this._buyWindow.active) {
		this._buyWindow.deactivate();
    	this.onBuyCancel();
	}
	Kien.BetterTouchMouseInput.Scene_Shop_commandSell.apply(this, arguments);
	this.onCategoryOk();
	this._categoryWindow.deactivate();
	this._currentSymbol = 'sell';
};

Scene_Shop.prototype.onSellCancel = function() {
    this._sellWindow.deselect();
    this._statusWindow.setItem(null);
    this._helpWindow.clear();
    this.onCategoryCancel();
};

Scene_Shop.prototype.endNumberInput = function() {
    this._numberWindow.hide();
    switch (this._currentSymbol) {
    case 'buy':
        this.activateBuyWindow();
        break;
    case 'sell':
        this.activateSellWindow();
        break;
    }
};

Scene_Shop.prototype.onNumberOk = function() {
    SoundManager.playShop();
    switch (this._currentSymbol) {
    case 'buy':
        this.doBuy(this._numberWindow.number());
        break;
    case 'sell':
        this.doSell(this._numberWindow.number());
        break;
    }
    this.endNumberInput();
    this._goldWindow.refresh();
    this._statusWindow.refresh();
};
