//=============================================================================
// Advanced Picture Movement
// AdvancedPictureMovement.js
// Version: 1.01
//=============================================================================
var Imported = Imported || {};
Imported.Kien_APM = true;

var Kien = Kien || {};
Kien.APM = {};
//=============================================================================
/*:
	@plugindesc Add few predefined way of moving for picture.
	@author Kien

	@help
	* Call plugin command before using Move Picture event command to set the 
	moving function for the movement. Function will set to default after each
	move command.
	* Here is the commands:
     - APMSetMovement [movename] [parameters]
    	- Set the movement command for movement.
    	- movename is the name of predefined function. 
    	- parameters is the parameter forthe function. 
    	- Detailed information is shown in below.
	 - APMSetEasing [easingname] [parameters]
		- Set the easing command for movement.
    	- easingname is the name of predefined function. 
    	- parameters is the parameter forthe function. 
    	- Detailed information is shown in below.
	* Movement Function Names: 
*/
Kien.APM.bezier = (function() {
/* Following Part are Released by Gaëtan Renaudeau under MIT Licsence
Liscense is located under:https://github.com/gre/bezier-easing/blob/master/LICENSE
Modified by Kien to fit the plugin.
/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
	var currentX, currentT, i = 0;
	do {
		currentT = aA + (aB - aA) / 2.0;
		currentX = calcBezier(currentT, mX1, mX2) - aX;
		if (currentX > 0.0) {
			aB = currentT;
		} else {
			aA = currentT;
		}
	} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
	return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
	for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
		var currentSlope = getSlope(aGuessT, mX1, mX2);
		if (currentSlope === 0.0) {
			return aGuessT;
		}
		var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
		aGuessT -= currentX / currentSlope;
	}
	return aGuessT;
}

return function bezier (mX1, mY1, mX2, mY2) { // Modified: return directly.
	if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
		throw new Error('bezier x values must be in [0, 1] range');
	}

	// Precompute samples table
	var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
	if (mX1 !== mY1 || mX2 !== mY2) {
		for (var i = 0; i < kSplineTableSize; ++i) {
			sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
		}
	}

	function getTForX (aX) {
		var intervalStart = 0.0;
		var currentSample = 1;
		var lastSample = kSplineTableSize - 1;

		for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
			intervalStart += kSampleStepSize;
		}
		--currentSample;

		// Interpolate to provide an initial guess for t
		var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
		var guessForT = intervalStart + dist * kSampleStepSize;

		var initialSlope = getSlope(guessForT, mX1, mX2);
		if (initialSlope >= NEWTON_MIN_SLOPE) {
			return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
		} else if (initialSlope === 0.0) {
			return guessForT;
		} else {
			return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
		}
	}

	return function BezierEasing (x) {
		if (mX1 === mY1 && mX2 === mY2) {
			return x; // linear
		}
		// Because JavaScript number are imprecise, we should guarantee the extremes are right.
		if (x === 0) {
			return 0;
		}
		if (x === 1) {
			return 1;
		}
		return calcBezier(getTForX(x), mY1, mY2);
	};
};
})();


//=============================================================================
// Defination Zone.
//=============================================================================
Kien.APM.Movement = {};

//=============================================================================
// Linear (Default)
//=============================================================================
Kien.APM.Movement["Linear"] = {
	init : function(){},
	param : function(){},
	run : function(input) {
		var t = input._actualDuration;
		var at = (1-t);
		var ax = input._startX;
		var bx = input._targetX;
		var ay = input._startY;
		var by = input._targetY;
		return [
			(1-t)*ax+t*bx,
			(1-t)*ay+t*by
		]
	}
}

//=============================================================================
// Quadratic Bezier Curves
//=============================================================================
Kien.APM.Movement["QuadraticBezier"] = {
	init : function(input, parameters) {
		this._parameter = [];
		if (!!parameters && parameters.length >= 2) {
			this._parameter = [
				eval(parameters[0]),
				eval(parameters[1])
			];
		}
	},
	run : function(input) {
		if (this._parameter.length < 2) {
			throw new Error("Not valid parameters");
		}
		var t = input._actualDuration;
		var at = (1-t);
		var ax = input._startX;
		var bx = input._targetX;
		var ay = input._startY;
		var by = input._targetY;
		var cx = this._parameter[0];
		var cy = this._parameter[1];
		if (t === 0) {
			return [input._startX, input._startY];
		}
		if (t === 1) {
			return [input._targetX, input._targetY];
		}
		return [
			at*at*ax+2*at*t*cx+t*t*bx,
			at*at*ay+2*at*t*cy+t*t*by
		]
	}
}

//=============================================================================
// SrcDiffQuadBezier
//=============================================================================
Kien.APM.Movement["SrcDiffQuadBezier"] = {
	init : function(input, parameters) {
		this._parameter = [];
		if (!!parameters && parameters.length >= 2) {
			this._parameter = [
				eval(parameters[0]),
				eval(parameters[1])
			];
		}
	},
	run : function(input) {
		if (this._parameter.length < 2) {
			throw new Error("Not valid parameters");
		}
		var t = input._actualDuration;
		var at = (1-t);
		var ax = input._startX;
		var bx = input._targetX;
		var ay = input._startY;
		var by = input._targetY;
		var cx = ax + this._parameter[0];
		var cy = ay + this._parameter[1];
		if (t === 0) {
			return [input._startX, input._startY];
		}
		if (t === 1) {
			return [input._targetX, input._targetY];
		}
		return [
			at*at*ax+2*at*t*cx+t*t*bx,
			at*at*ay+2*at*t*cy+t*t*by
		]
	}
}

//=============================================================================
// DestDiffQuadBezier
//=============================================================================
Kien.APM.Movement["DestDiffQuadBezier"] = {
	init : function(input, parameters) {
		this._parameter = [];
		if (!!parameters && parameters.length >= 2) {
			this._parameter = [
				eval(parameters[0]),
				eval(parameters[1])
			];
		}
	},
	run : function(input) {
		if (this._parameter.length < 2) {
			throw new Error("Not valid parameters");
		}
		var t = input._actualDuration;
		var at = (1-t);
		var ax = input._startX;
		var bx = input._targetX;
		var ay = input._startY;
		var by = input._targetY;
		var cx = bx + this._parameter[0];
		var cy = by + this._parameter[1];
		if (t === 0) {
			return [input._startX, input._startY];
		}
		if (t === 1) {
			return [input._targetX, input._targetY];
		}
		return [
			at*at*ax+2*at*t*cx+t*t*bx,
			at*at*ay+2*at*t*cy+t*t*by
		]
	}
}


Kien.APM.Easing = {};

//=============================================================================
// Linear (Default)
//=============================================================================
Kien.APM.Easing["Linear"] = {
	init : function(input) {},
	run : function(input) {
		var t = 1 - (input._duration / input._maxDuration);
		if (t === 0) {
			input._actualDuration = 0;
		} else if (t === 1) {
			input._actualDuration = 1;
		} else {
			input._actualDuration = t;
		}
	}
}

//=============================================================================
// easeInSine
//=============================================================================
Kien.APM.Easing["easeInSine"] = {
	init : function(input) {},
	run : function(input) {
		var t = 1 - (input._duration / input._maxDuration);
		if (t === 0) {
			input._actualDuration = 0;
		} else if (t === 1) {
			input._actualDuration = 1;
		} else {
			input._actualDuration = 1 + Math.sin((t - 1) * Math.PI / 2);
		}
	}
}

//=============================================================================
// easeOutSine
//=============================================================================
Kien.APM.Easing["easeOutSine"] = {
	init : function(input) {},
	run : function(input) {
		var t = 1 - (input._duration / input._maxDuration);
		if (t === 0) {
			input._actualDuration = 0;
		} else if (t === 1) {
			input._actualDuration = 1;
		} else {
			input._actualDuration = Math.sin(t * Math.PI / 2);
		}
	}
}

//=============================================================================
// easeInOutSine
//=============================================================================
Kien.APM.Easing["easeInOutSine"] = {
	init : function(input) {},
	run : function(input) {
		var t = 1 - (input._duration / input._maxDuration);
		if (t === 0) {
			input._actualDuration = 0;
		} else if (t === 1) {
			input._actualDuration = 1;
		} else {
			input._actualDuration = (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
		}
	}
}

//=============================================================================
// ease in power
//=============================================================================
// From https://gist.github.com/gre/1650294, by lindell.
Kien.APM.funcs = {};
Kien.APM.funcs.in = function(pow) {
	return function(t) {return Math.pow(t,pow)};
};
Kien.APM.funcs.out = function(pow) {
	return function(t) {return 1 - Math.pow(t-1, pow)};
};
Kien.APM.funcs.inout = function(pow) {
	return function(t) {
		return t<.5 ? 
		Kien.APM.funcs.in(pow)(t*2)/2 : 
		Kien.APM.funcs.out(pow)(t*2 - 1)/2 + 0.5
	}
};

(function() {
	var name = ["Quad","Cubic", "Quart", "Quint"];
	var val = [2,3,4,5];
	for (var i = 0; i < name.length; i++) {
		if (!!val[i]) {
			var p = val[i];
			var n = name[i];
			Kien.APM.Easing["easeIn" + n] = 
			{
				init : function(input) {},
				run : function(input) {
					var t = 1 - (input._duration / input._maxDuration);
					if (t === 0) {
						input._actualDuration = 0;
					} else if (t === 1) {
						input._actualDuration = 1;
					} else {
						input._actualDuration = Kien.APM.funcs.in(p)(t);
					}
				}
			}
			Kien.APM.Easing["easeOut" + n] = 
			{
				init : function(input) {},
				run : function(input) {
					var t = 1 - (input._duration / input._maxDuration);
					if (t === 0) {
						input._actualDuration = 0;
					} else if (t === 1) {
						input._actualDuration = 1;
					} else {
						input._actualDuration = Kien.APM.funcs.out(p)(t);
					}
				}
			}
			Kien.APM.Easing["easeInOut" + n] = 
			{
				init : function(input) {},
				run : function(input) {
					var t = 1 - (input._duration / input._maxDuration);
					if (t === 0) {
						input._actualDuration = 0;
					} else if (t === 1) {
						input._actualDuration = 1;
					} else {
						input._actualDuration = Kien.APM.funcs.inout(p)(t);
					}
				}
			}
		}
	}
})();

//=============================================================================
// Definition Zone Finish
//=============================================================================

Kien.APM.getMovement = function(name) {
	if (Kien.APM.Movement[name]) {
		return Object.create(Kien.APM.Movement[name]);
	} else {
		return Object.create(Kien.APM.Movement["Linear"]);
	}
}

Kien.APM.getEasing = function(name){
	if (Kien.APM.Easing[name]) {
		return Object.create(Kien.APM.Easing[name]);
	} else {
		return Object.create(Kien.APM.Easing["Linear"]);
	}
}

//-----------------------------------------------------------------------------
// Game_Screen
//
// The game object class for screen effect data, such as changes in color tone
// and flashes.

Kien.APM.Game_Screen_movePicture = Game_Screen.prototype.movePicture;
Game_Screen.prototype.movePicture = function(pictureId, origin, x, y, scaleX,
                                             scaleY, opacity, blendMode, duration) {
	Kien.APM.Game_Screen_movePicture.apply(this, arguments);
	var picture = this.picture(pictureId);
	this._lastPictureMoved = picture;
};

Game_Screen.prototype.setPictureEasing = function(name, parameters) {
    var picture = this._lastPictureMoved;
    if (picture) {
        picture.setEasingFunction(name, parameters);
    }
};

Game_Screen.prototype.setPictureMovement = function(name, parameters) {
    var picture = this._lastPictureMoved;
    if (picture) {
        picture.setMovementFunction(name, parameters);
    }
};

//-----------------------------------------------------------------------------
// Game_Picture
//
// The game object class for a picture.

Kien.APM.Game_Picture_initialize = Game_Picture.prototype.initialize;
Game_Picture.prototype.initialize = function() {
	Kien.APM.Game_Picture_initialize.apply(this, arguments);
	this.initAPM();
};

Game_Picture.prototype.initAPM = function() {
	this._maxDuration = 0;
	this._actualDuration = 0; // duration processed by easing.
	this._startX = 0;
	this._startY = 0;
	this._startScaleX = 0;
	this._startScaleY = 0;
	this._startOpacity = 0;
	this._movementFunction = null;
	this._easingFunction = null;
}

Kien.APM.Game_Picture_erase = Game_Picture.prototype.erase;
Game_Picture.prototype.erase = function() {
	Kien.APM.Game_Picture_erase.apply(this, arguments);
	this.initAPM();
};

Kien.APM.Game_Picture_show = Game_Picture.prototype.show;
Game_Picture.prototype.show = function(name, origin, x, y, scaleX,
                                       scaleY, opacity, blendMode) {
	Kien.APM.Game_Picture_show.apply(this, arguments);
	this.initAPM();
};

Kien.APM.Game_Picture_move = Game_Picture.prototype.move;
Game_Picture.prototype.move = function(origin, x, y, scaleX, scaleY,
                                       opacity, blendMode, duration) {
	Kien.APM.Game_Picture_move.apply(this, arguments);
	this.initAPM();
	this._startX = this._x
	this._startY = this._y;
	this._startScaleX = this._scaleX;
	this._startScaleY = this._scaleY;
	this._startOpacity = this._opacity;
	this._maxDuration = duration;
};

Game_Picture.prototype.setMovementFunction = function(name, parameters) {
	this._movementFunction = Kien.APM.getMovement(name);
	this._movementFunction.init(this, parameters);
}

Game_Picture.prototype.setEasingFunction = function(name, parameters) {
	this._easingFunction = Kien.APM.getEasing(name);
	this._easingFunction.init(this, parameters);
}

Game_Picture.prototype.ensureFunctions = function() {
	if (!this._movementFunction) {
		this._movementFunction = Kien.APM.getMovement("Linear");
	}
	if (!this._easingFunction) {
		this._easingFunction = Kien.APM.getEasing("Linear");
	}
}

Game_Picture.prototype.updateMove = function() {
    if (this._duration > 0) {
    	this._duration--;
    	this.ensureFunctions();
    	this._easingFunction.run(this);
    	var xy = this._movementFunction.run(this);
        this._x = xy[0];
        this._y = xy[1];
        var t = this._actualDuration;
        if (t === 1) {
        	this._scaleX = this._targetScaleX;
        	this._scaleY = this._targetScaleY;
        	this._opacity = this._targetOpacity;
        } else {
	        this._scaleX  = this._startScaleX  * (1 - t) + this._targetScaleX * t;
	        this._scaleY  = this._startScaleY  * (1 - t) + this._targetScaleY * t;
	        this._opacity = this._startOpacity * (1 - t) + this._targetOpacity * t;
        }
        if (this._duration == 0) {
			this.initAPM();
        }
    }
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

Kien.APM.Game_Interpreter_clear = Game_Interpreter.prototype.clear;
Game_Interpreter.prototype.clear = function() {
	Kien.APM.Game_Interpreter_clear.apply(this, arguments);
    this._easingName = null;
    this._easingParameters = null;
    this._movementName = null;
    this._movementParameters = null;
    this._overridePictureId = 0;
    this._overridePictureOpacity = 0;
    this._overridePictureScaleX = 0;
    this._overridePictureScaleY = 0;
};

// Move Picture
Game_Interpreter.prototype.command232 = function() {
    var x, y;
    if (this._params[3] === 0) {  // Direct designation
        x = this._params[4];
        y = this._params[5];
    } else {  // Designation with variables
        x = $gameVariables.value(this._params[4]);
        y = $gameVariables.value(this._params[5]);
    }
    var pictureId = this._params[0];
    if (this._overridePictureId > 0) {
    	pictureId = $gameVariables.value(this._overridePictureId);
    }
    var opacity = this._params[8];
    if (this._overridePictureOpacity > 0) {
    	opacity = $gameVariables.value(this._overridePictureOpacity);
    }
    var scaleX  = this._params[6];
    if (this._overridePictureScaleX > 0) {
    	scaleX = $gameVariables.value(this._overridePictureScaleX);
    }
    var scaleY  = this._params[7];
    if (this._overridePictureScaleY > 0) {
    	scaleY = $gameVariables.value(this._overridePictureScaleY);
    }
    $gameScreen.movePicture(pictureId, this._params[2], x, y, scaleX,
        scaleY, opacity, this._params[9], this._params[10]);
    if (this._easingName != null) {
    	$gameScreen.setPictureEasing(this._easingName, 
    		this._easingParameters);
    	this._easingName = null;
    	this._easingParameters = null;
    }
    if (this._movementName != null) {
    	$gameScreen.setPictureMovement(this._movementName, 
    		this._movementParameters);
    	this._movementName = null;
    	this._movementParameters = null;
    }
    if (this._params[11]) {
        this.wait(this._params[10]);
    }
    return true;
};

// Show Picture
Game_Interpreter.prototype.command231 = function() {
    var x, y;
    if (this._params[3] === 0) {  // Direct designation
        x = this._params[4];
        y = this._params[5];
    } else {  // Designation with variables
        x = $gameVariables.value(this._params[4]);
        y = $gameVariables.value(this._params[5]);
    }
    var pictureId = this._params[0];
    if (this._overridePictureId > 0) {
    	pictureId = $gameVariables.value(this._overridePictureId);
    }
    var opacity = this._params[8];
    if (this._overridePictureOpacity > 0) {
    	opacity = $gameVariables.value(this._overridePictureOpacity);
    }
    var scaleX  = this._params[6];
    if (this._overridePictureScaleX > 0) {
    	scaleX = $gameVariables.value(this._overridePictureScaleX);
    }
    var scaleY  = this._params[7];
    if (this._overridePictureScaleY > 0) {
    	scaleY = $gameVariables.value(this._overridePictureScaleY);
    }
    $gameScreen.showPicture(pictureId, this._params[1], this._params[2],
        x, y, scaleX, scaleY, opacity, this._params[9]);
    return true;
};


// Rotate Picture
Game_Interpreter.prototype.command233 = function() {
    var pictureId = this._params[0];
    if (this._overridePictureId > 0) {
    	pictureId = $gameVariables.value(this._overridePictureId);
    }
    $gameScreen.rotatePicture(pictureId, this._params[1]);
    return true;
};

// Tint Picture
Game_Interpreter.prototype.command234 = function() {
    var pictureId = this._params[0];
    if (this._overridePictureId > 0) {
    	pictureId = $gameVariables.value(this._overridePictureId);
    }
    $gameScreen.tintPicture(pictureId, this._params[1], this._params[2]);
    if (this._params[3]) {
        this.wait(this._params[2]);
    }
    return true;
};

// Erase Picture
Game_Interpreter.prototype.command235 = function() {
    var pictureId = this._params[0];
    if (this._overridePictureId > 0) {
    	pictureId = $gameVariables.value(this._overridePictureId);
    }
    $gameScreen.erasePicture(pictureId);
    return true;
};

Game_Interpreter.prototype.APMSetMovement = function(name) {
	this._movementName = name;
	this._movementParameters = Kien.lib.argsToArr(arguments).splice(1);
}

Game_Interpreter.prototype.APMSetEasing = function(name) {
	this._easingName = name;
	this._easingParameters = Kien.lib.argsToArr(arguments).splice(1);
}

Game_Interpreter.prototype.APMSetPictureId = function(string) {
	this._overridePictureId = eval(string);
}

Game_Interpreter.prototype.APMSetOpacity = function(string) {
	this._overridePictureOpacity = eval(string);
}

Game_Interpreter.prototype.APMSetScaleX = function(string) {
	this._overridePictureScaleX = eval(string);
}

Game_Interpreter.prototype.APMSetScaleY = function(string) {
	this._overridePictureScaleY = eval(string);
}

Kien.lib.addPluginCommand("APMSetMovement", 	Game_Interpreter.prototype.APMSetMovement);
Kien.lib.addPluginCommand("APMSetEasing",   	Game_Interpreter.prototype.APMSetEasing);
Kien.lib.addPluginCommand("APMSetPictureId",	Game_Interpreter.prototype.APMSetPictureId);
Kien.lib.addPluginCommand("APMSetOpacity",		Game_Interpreter.prototype.APMSetOpacity);
Kien.lib.addPluginCommand("APMSetScaleX",		Game_Interpreter.prototype.APMSetScaleX);
Kien.lib.addPluginCommand("APMSetScaleY",		Game_Interpreter.prototype.APMSetScaleY);

