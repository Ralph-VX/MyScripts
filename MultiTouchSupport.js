//=============================================================================
// Multi Touch Support
// MultiTouchSupport.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_MultiTouchSupport = true;

var Kien = Kien || {};
Kien.MultiTouchSupport = {};
//=============================================================================
/*:
 * @plugindesc Allow Multi Touch screen to function properly.
 * @author Kien
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
 * @param Use Mouse as Touch
 * @desc consider mouse inputs as touch action. When false, use default mouse system.
 * @default true
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
// MultiTouchSupport.js
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

Kien.MultiTouchSupport.parameters = PluginManager.parameters("MultiTouchSupport");
Kien.MultiTouchSupport.flickLength = parseInt(Kien.MultiTouchSupport.parameters["Flick Length"]);
Kien.MultiTouchSupport.longTouchLength = parseInt(Kien.MultiTouchSupport.parameters["Long Touch Length"]);
Kien.MultiTouchSupport.multiTouchThreshold = parseInt(Kien.MultiTouchSupport.parameters["MultiTouch Threshold"]);
Kien.MultiTouchSupport.swipeThreshold = parseInt(Kien.MultiTouchSupport.parameters["Swipe Threshold"]);
Kien.MultiTouchSupport.mouseAsTouch = eval(Kien.MultiTouchSupport.parameters["Use Mouse as Touch"]);
Kien.MultiTouchSupport.debugMode = eval(Kien.MultiTouchSupport.parameters["Debug Mode"]);


if (!Imported.Kien_Lib) {
    throw new Error("No Library Found.\n Please put KienLib.js above this plugin.");
}

//-----------------------------------------------------------------------------
// TouchPoint
//
//   Represents a single touch point. Also provide functionalities to examine 
// The movement.

TouchPoint.flickLength = Kien.MultiTouchSupport.flickLength;
TouchPoint.longTouchLength = Kien.MultiTouchSupport.longTouchLength;
TouchPoint.swipeThreshold = Kien.MultiTouchSupport.swipeThreshold;
TouchPoint.multiTouchThreshold = Kien.MultiTouchSupport.multiTouchThreshold;

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
	this._path.push({'x': this._x, 'y': this._y, 'distance': 0});
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
	this._path.push({x: this._x, y: this._y});
	var dis = Math.sqrt(dx * dx + dy * dy);
	this._distance += dis;
	this._path[this._path.length - 1].distance = dis;
}

TouchPoint.prototype.onEnd = function(touch) {
	this._x = Graphics.pageToCanvasX(touch.pageX);
	this._y = Graphics.pageToCanvasY(touch.pageY);
	var dx = this._x - this._path[this._path.length - 1].x; 
	var dy = this._y - this._path[this._path.length - 1].y;
	this._path.push({x: this._x, y: this._y});
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
/**
 * The static class that handles input data from the mouse and touchscreen.
 *
 * @class TouchInput
 */

Kien.MultiTouchSupport.TouchInput_clear = TouchInput.clear;
TouchInput.clear = function() {
	Kien.MultiTouchSupport.TouchInput_clear.call(this);
	this._kienTouches = {};
	this._kienReturnedTouchIdentifiers = []
	this._kienTouchIdentifiers = [];
	this._kienFrameCount = Graphics.frameCount;
	this._kienIsMouse = false;
	this.clearKienEvent();
}

Kien.MultiTouchSupport.TouchInput_update = TouchInput.update;
TouchInput.update = function() {
	Kien.MultiTouchSupport.TouchInput_update.call(this);
	this.updateDebug();
	this.clearFinishedTouch();
	this.updateKienTouch();
	if (Graphics.frameCount != this._kienFrameCount) {
		this.clearKienEvent();
		this._kienFrameCount = Graphics.frameCount;
	}
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
}

TouchInput.updateKienTouch = function() {
	for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
		var ti = this._kienTouchIdentifiers[n];
		var tp = this._kienTouches[ti];
		if (tp._finish && tp._duration > 0) {
			tp._duration--;
		}
	}
	for (var n = 0; n < this._kienTouchMoveEvent.length; n++ ) {
		var touch = this._kienTouchMoveEvent[n];
		var tp = this._kienTouches[touch.identifier];
		if (tp) {
			tp.onMove(touch);
		}
	}
	for (var n = 0; n < this._kienTouchEndEvent.length; n++ ) {
		var touch = this._kienTouchEndEvent[n];
		var tp = this._kienTouches[touch.identifier];
		if (tp) {
			tp.onEnd(touch);
		}
	}
	if (Kien.MultiTouchSupport.debugMode) {
		for (var n = 0; n < this._kienTouchIdentifiers.length; n++) {
			var ti = this._kienTouchIdentifiers[n];
			var tp = this._kienTouches[ti];
		}
	}
}

TouchInput._kienOnTouchStart = function(event) {
	for (var n = 0; n < event.changedTouches.length; n++) {
		var t = event.changedTouches[n];
		var tp = new TouchPoint(t);
		this._kienTouches[t.identifier] = tp;
		this._kienTouchStartEvent.push(t);
		if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
			this._kienTouchIdentifiers.push(t.identifier);
		}
	}
	this._kienRemoveUnavailablePoint(event);
}

Kien.MultiTouchSupport.TouchInput_onTouchStart = TouchInput._onTouchStart;
TouchInput._onTouchStart = function(event) {
	Kien.MultiTouchSupport.TouchInput_onTouchStart.call(this, event);
	this._kienOnTouchStart(event);
}


Kien.MultiTouchSupport.TouchInput_onTouchMove = TouchInput._onTouchMove;
TouchInput._onTouchMove = function(event) {
	Kien.MultiTouchSupport.TouchInput_onTouchMove.call(this, event);
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

Kien.MultiTouchSupport.TouchInput_onTouchEnd = TouchInput._onTouchEnd;
TouchInput._onTouchEnd = function(event) {
	Kien.MultiTouchSupport.TouchInput_onTouchEnd.call(this, event);
	this._kienOnTouchEnd(event);
}

Kien.MultiTouchSupport.TouchInput_onTouchCancel = TouchInput._onTouchCancel;
TouchInput._onTouchCancel = function(event) {
	Kien.MultiTouchSupport.TouchInput_onTouchCancel.call(this, event);
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
	allidentifiers.push('leftbutton');
	allidentifiers.push('rightbutton');
	allidentifiers.push('middlebutton');
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

Kien.MultiTouchSupport.TouchInput_onRightBUttonDown = TouchInput._onRightButtonDown;
TouchInput._onRightButtonDown = function(event) {
	Kien.MultiTouchSupport.TouchInput_onRightBUttonDown.call(this, event);
	if (Kien.MultiTouchSupport.mouseAsTouch) {
		var t = Kien.cloneEvent(event);
		t.identifier = 'rightbutton';
		var tp = new TouchPoint(t);
		this._kienTouches[t.identifier] = tp;
		this._kienTouchStartEvent.push(t);
		if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
			this._kienTouchIdentifiers.push(t.identifier);
		}
	} else {
	    var x = Graphics.pageToCanvasX(event.pageX);
	    var y = Graphics.pageToCanvasY(event.pageY);
	    if (Graphics.isInsideCanvas(x, y)) {
	        this._kienIsMouse = true;
	    }
	}
};

Kien.MultiTouchSupport.TouchInput_onMiddleButtonDown = TouchInput._onMiddleButtonDown;
TouchInput._onMiddleButtonDown = function(event) {
	Kien.MultiTouchSupport.TouchInput_onMiddleButtonDown.call(this, event);
	if (Kien.MultiTouchSupport.mouseAsTouch) {
		var t = Kien.cloneEvent(event);
		t.identifier = 'middlebutton';
		var tp = new TouchPoint(t);
		this._kienTouches[t.identifier] = tp;
		this._kienTouchStartEvent.push(t);
		if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
			this._kienTouchIdentifiers.push(t.identifier);
		}
	} else {
	    var x = Graphics.pageToCanvasX(event.pageX);
	    var y = Graphics.pageToCanvasY(event.pageY);
	    if (Graphics.isInsideCanvas(x, y)) {
	        this._kienIsMouse = true;
	    }
	}
};

Kien.MultiTouchSupport.TouchInput_onLeftButtonDown = TouchInput._onLeftButtonDown;
TouchInput._onLeftButtonDown = function(event) {
	Kien.MultiTouchSupport.TouchInput_onLeftButtonDown.call(this, event);
	if (Kien.MultiTouchSupport.mouseAsTouch) {
		var t = Kien.cloneEvent(event);
		t.identifier = 'leftbutton';
		var tp = new TouchPoint(t);
		this._kienTouches[t.identifier] = tp;
		this._kienTouchStartEvent.push(t);
		if (this._kienTouchIdentifiers.indexOf(t.identifier) === -1) {
			this._kienTouchIdentifiers.push(t.identifier);
		}
	} else {
	    var x = Graphics.pageToCanvasX(event.pageX);
	    var y = Graphics.pageToCanvasY(event.pageY);
	    if (Graphics.isInsideCanvas(x, y)) {
	        this._kienIsMouse = true;
	    }
	}
};

Kien.MultiTouchSupport.TouchInput_onMouseUp = TouchInput._onMouseUp;
TouchInput._onMouseUp = function(event) {
	Kien.MultiTouchSupport.TouchInput_onMouseUp.call(this, event);
	this._kienonMouseUp(event);
}

TouchInput._kienonMouseUp = function(event) {
	if (Kien.MultiTouchSupport.mouseAsTouch) {
		var t = Kien.cloneEvent(event);
		if (event.button == 0) {
			t.identifier = 'leftbutton';
		} else if (event.button == 1) {
			t.identifier = 'middlebutton';
		} else if (event.button == 2) {
			t.identifier = 'rightbutton';
		}
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
	} else {
		this._kienIsMouse = false;
	}
}

Kien.MultiTouchSupport.TouchInput_onMouseMove = TouchInput._onMouseMove;
TouchInput._onMouseMove = function(event) {
	Kien.MultiTouchSupport.TouchInput_onMouseMove.call(this, event);
	this._kienMouseMove(event);
}

TouchInput._kienMouseMove = function(event) {
	if (Kien.MultiTouchSupport.mouseAsTouch) {
		if (this._kienIsLeftDown()) {
			this._kienMouseMoveInner('leftbutton', event);
		}
		if (this._kienIsMiddleDown()) {
			this._kienMouseMoveInner('middlebutton', event);
		}
		if (this._kienIsRightDown()) {
			this._kienMouseMoveInner('rightbutton', event);
		}
	}
}

TouchInput._kienMouseMoveInner = function(identifier, event) {
	var t = Kien.cloneEvent(event);
	t.identifier = identifier;
	var tp = this._kienTouches[t.identifier];
	if (!!tp) {
		this._kienTouchMoveEvent.push(t);
	}
}

TouchInput._kienIsLeftDown = function() {
	return this._kienTouchIdentifiers.indexOf('leftbutton') !== -1;
}

TouchInput._kienIsMiddleDown = function() {
	return this._kienTouchIdentifiers.indexOf('middlebutton') !== -1;
}

TouchInput._kienIsRightDown = function() {
	return this._kienTouchIdentifiers.indexOf('rightbutton') !== -1;
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
//   return null if no finger is currently touching screen, or the amount of finger is not enough.//   return All TouchPoint object that is satisfing, or an array of TouchPoint object when fingers is specified above 1.

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
			if (tp.isTouching()) {
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
			if (tp.isTouching()) {
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

Kien.MultiTouchSupport.TouchInput_isCancelled = TouchInput.isCancelled;
TouchInput.isCancelled = function() {
    return this.isMouse() ? Kien.MultiTouchSupport.TouchInput_isCancelled.call(this) : this.isTouched(2, true, true);
};

Kien.MultiTouchSupport.TouchInput_isTriggered = TouchInput.isTriggered;
TouchInput.isTriggered = function() {
    return this.isMouse() ? Kien.MultiTouchSupport.TouchInput_isTriggered.call(this) : this.isTouched(1, true, true);
};

TouchInput.isMouse = function() {
	return this._kienIsMouse;
}

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
/**
 * The basic object that represents an image.
 *
 * @class Bitmap
 * @constructor
 * @param {Number} width The width of the bitmap
 * @param {Number} height The height of the bitmap
 */

Bitmap.prototype.drawLine = function(x1, y1, x2, y2, color, width) {
    var context = this._context;
    context.save();
    context.strokeStyle = color;
    context.lineWidth = width || 1;
    context.beginPath();
    context.moveTo(x1,y1);
    context.lineTo(x2,y2);
    context.stroke();
    context.restore();
    this._setDirty();
};

//-----------------------------------------------------------------------------
// Game_Temp
//
// The game object class for temporary data that is not included in save data.

Kien.MultiTouchSupport.Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
	Kien.MultiTouchSupport.Game_Temp_initialize.call(this);
	this._mapTouchPoint = null;
};

Kien.MultiTouchSupport.Game_Temp_isDestinationValid = Game_Temp.prototype.isDestinationValid;
Game_Temp.prototype.isDestinationValid = function() {
    return Kien.MultiTouchSupport.Game_Temp_isDestinationValid.call(this) ||  this._mapTouchPoint != null;
};

Kien.MultiTouchSupport.Game_Temp_destinationX = Game_Temp.prototype.destinationX;
Game_Temp.prototype.destinationX = function() {
    return Kien.MultiTouchSupport.Game_Temp_destinationX.call(this) || $gameMap.canvasToMapX(this._mapTouchPoint.x);
};

Kien.MultiTouchSupport.Game_Temp_destinationY = Game_Temp.prototype.destinationY;
Game_Temp.prototype.destinationY = function() {
    return Kien.MultiTouchSupport.Game_Temp_destinationY.call(this) || $gameMap.canvasToMapY(this._mapTouchPoint.y);
};

Kien.MultiTouchSupport.Game_Temp_clearDestination = Game_Temp.prototype.clearDestination;
Game_Temp.prototype.clearDestination = function() {
	Kien.MultiTouchSupport.Game_Temp_clearDestination.call(this);
	this._mapTouchPoint = null;
};
//-----------------------------------------------------------------------------
// Sprite_Button
//
// The sprite for displaying a button.
// As a sample for how this TouchPoint system works.

Kien.MultiTouchSupport.Sprite_Button_initialize = Sprite_Button.prototype.initialize;
Sprite_Button.prototype.initialize = function() {
    Kien.MultiTouchSupport.Sprite_Button_initialize.call(this);
    this._touchPoint = null;
};

Kien.MultiTouchSupport.Sprite_Button_updateFrame = Sprite_Button.prototype.updateFrame;
Sprite_Button.prototype.updateFrame = function() {
	if (TouchInput.isMouse()){
		return Kien.MultiTouchSupport.Sprite_Button_updateFrame.call(this);
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

Kien.MultiTouchSupport.Sprite_Button_processTouch = Sprite_Button.prototype.processTouch;
Sprite_Button.prototype.processTouch = function() {
    if (this.isActive()) {
    	if (TouchInput.isMouse()) {
    		Kien.MultiTouchSupport.Sprite_Button_processTouch.call(this);
    	} else if (this._touching) {
            this._touching = false;
            this.callClickHandler();
            return;
    	}
    	if (!this._touchPoint) {
    	// Retrieve all TouchPoint currently exists.
	    	var arrs = TouchInput.isTouching();
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

	    	}
    	} else {
    		// if the touch is released and the point is still inside the sprite;
            if (!this._touchPoint.isTouching() && this.isButtonTouched(this._touchPoint)) {
            	// as we don't want this touch trigger events any furthur, so don't deallocate it. 
            	this._touchPoint = null;
                this.callClickHandler();
            } else if (!this.isButtonTouched()) {
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
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
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

Kien.MultiTouchSupport.Window_Selectable_initialize = Window_Selectable.prototype.initialize;
Window_Selectable.prototype.initialize = function(x, y, width, height) {
	this._touchPoint = null;
	this._touchIndex = -1;
	this._touchWait = 0;
	this._allowNonActive = false;
	Kien.MultiTouchSupport.Window_Selectable_initialize.call(this, x, y, width, height); 
};

Kien.MultiTouchSupport.Window_Selectable_processTouch = Window_Selectable.prototype.processTouch;
Window_Selectable.prototype.processTouch = function() {
	if (TouchInput.isMouse()) {
		Kien.MultiTouchSupport.Window_Selectable_processTouch.call(this);
		return;
	}
    if (this.isOpenAndActive() || (this.isOpen() && this._allowNonActive) ) {
    	if (!this._touchPoint) {
    		if (this.isCancelEnabled() && TouchInput.isTouched(2,true,true) && this.isOpenAndActive()) {
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

Kien.MultiTouchSupport.Window_Selectable_onTouch = Window_Selectable.prototype.onTouch;
Window_Selectable.prototype.onTouch = function(triggered) {
	if (TouchInput.isMouse()) {
		Kien.MultiTouchSupport.Window_Selectable_onTouch.call(this, triggered);
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

Window_ShopCommand.prototype.makeCommandList = function() {
    this.addCommand(TextManager.buy,    'buy');
    this.addCommand(TextManager.sell,   'sell',   !this._purchaseOnly);
    this.addCommand(TextManager.cancel, 'finish');
};

//-----------------------------------------------------------------------------
// Window_Message
//
// The window for displaying text messages.

Window_Message.prototype.isTriggered = function() {
    return (Input.isRepeated('ok') || Input.isRepeated('cancel') ||
            TouchInput.isTouched(1,true,true));
};

//-----------------------------------------------------------------------------
// Scene_Map
//
// The scene class of the map screen.

Kien.MultiTouchSupport.Scene_Map_initialize = Scene_Map.prototype.initialize;
Scene_Map.prototype.initialize = function() {
	Kien.MultiTouchSupport.Scene_Map_initialize.call(this);
	this._touchPoint = null;
};

Kien.MultiTouchSupport.Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function() {
	if (TouchInput.isMouse()) {
		Kien.MultiTouchSupport.Scene_Map_processMapTouch.call(this);
	}
	if ($gameMap.isEventRunning()) {
		this._touchPoint = null;
		$gameTemp.clearDestination();
		return;
	}
	if (!this._touchPoint) {
		this._touchPoint = TouchInput.isTouching(1,true,true);
		if (this._touchPoint) {
			this._touchPoint = this._touchPoint[0];
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

//-----------------------------------------------------------------------------
// Scene_Shop
//
// The scene class of the shop screen.

Scene_Shop.prototype.createCommandWindow = function() {
    this._commandWindow = new Window_ShopCommand(this._goldWindow.x, this._purchaseOnly);
    this._commandWindow.y = this._helpWindow.height;
    this._commandWindow.setHandler('buy',    this.commandBuy.bind(this));
    this._commandWindow.setHandler('sell',   this.commandSell.bind(this));
    this._commandWindow.setHandler('finish', this.popScene.bind(this));
	this._commandWindow._allowNonActive = true;
    this.addWindow(this._commandWindow);
};

Kien.MultiTouchSupport.Scene_Shop_commandBuy = Scene_Shop.prototype.commandBuy;
Scene_Shop.prototype.commandBuy = function() {
    this.endNumberInput();
	this.onSellCancel();
	this.onCategoryCancel();
	Kien.MultiTouchSupport.Scene_Shop_commandBuy.call(this);
	this._currentSymbol = 'buy';
};

Kien.MultiTouchSupport.Scene_Shop_commandSell = Scene_Shop.prototype.commandSell;
Scene_Shop.prototype.commandSell = function() {
    this.endNumberInput();
    this.onBuyCancel();
	Kien.MultiTouchSupport.Scene_Shop_commandSell.call(this);
	this._currentSymbol = 'sell';
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
