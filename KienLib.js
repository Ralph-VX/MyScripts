//=============================================================================
// Kien Library
// KienLib.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_Lib = true;

var Kien = Kien || {};
Kien.lib = {};


Kien.lib.pluginCommands = {};

Kien.lib.addPluginCommand = function(command, func) {
    Kien.lib.pluginCommands[command] = func;
}

Kien.lib.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    var func = Kien.lib.pluginCommands[command];
    if (!!func) {
        func.call(this, args);
    } else {
        Kien.lib.Game_Interpreter_pluginCommand.call(this, command, args);
    }
};

//-----------------------------------------------------------------------------
// Rectangle
//
// Define a utility Function.
if (!Rectangle.prototype.cx) {
    Object.defineProperty(Rectangle.prototype, 'left', {
        get: function() {
            return this.x;
        },
        set: function(value) {
            var dx = value - this.x;
            if (dx <= this.width) {
                this.x += dx;
                this.width -= dx;
            } else {
                this.x = this.width;
                this.width = dx - this.width;
            }
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'right', {
        get: function() {
            return this.x + this.width;
        },
        set: function() {
            var dx = value - this.x+this.width;
            if (value >= this.x) {
                this.width += dx;
            } else {
                var lx = this.x;
                this.x += value;
                this.width = lx - this.x;
            }
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'top', {
        get: function() {
            return this.y;
        },
        set: function(value) {
            var dy = value - this.y;
            if (dy <= this.height) {
                this.y += dy;
                this.height -= dy;
            } else {
                this.y = this.height;
                this.height = dy - this.height;
            }
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'bottom', {
        get: function() {
            return this.y + this.height;
        },
        set: function() {
            var dy = value - this.y+this.width;
            if (value >= this.y) {
                this.width += dy;
            } else {
                var ly = this.y;
                this.y += value;
                this.width = ly - this.y;
            }
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'cx', {
        get: function() {
            return this.x + this.width/2;
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'cy', {
        get: function() {
            return this.y + this.height/2;
        },
        configurable: true
    });

    Object.defineProperty(Rectangle.prototype, 'radius', {
        get: function() {
            return Math.sqrt(Math.pow(this.cx-this.x,2) + Math.pow(this.cy-this.y,2));
        },
        configurable: true
    })

    Rectangle.prototype.side = function(direction) {
        switch(direction) {
            case 2:
                return [new Point(this.left, this.bottom), new Point(this.right, this.bottom)];
            case 4:
                return [new Point(this.left, this.top), new Point(this.left, this.bottom)];
            case 6:
                return [new Point(this.right, this.top), new Point(this.right, this.bottom)];
            case 8:
                return [new Point(this.left, this.top), new Point(this.right, this.top)];
        }
        return [new Point(this.cx, this.cy)];
    }

    Rectangle.prototype.overlap = function(other) {
        return (Math.abs(this.cx - other.cx) <= (this.width/2 + other.width/2)) && (Math.abs(this.cy - other.cy) <= (this.height/2 + other.height/2))
    };

    Rectangle.prototype.includePoint = function(point) {
        return (point.x >= this.x) && (point.x < this.x+this.width) && (point.y >= this.y) && (point.y < this.y+this.height);
    }

    Rectangle.prototype.clone = function() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    Rectangle.fromString = function(string) {
        var arr = string.split(',');
        return new Rectangle(parseFloat(arr[0]),parseFloat(arr[1]),parseFloat(arr[2]),parseFloat(arr[3]));
    }
}

//-----------------------------------------------------------------------------
// Vector2D
//
// A vector object in 2d space.

if (!Kien.Vector2D) {
    Kien.Vector2D = function () {
        this.initialize.apply(this, arguments);
    }

    Kien.Vector2D.prototype.initialize = function(x,y) {
        this._x = x || 0;
        this._y = y || 0;
    }

    Object.defineProperty(Kien.Vector2D.prototype, 'x', {
        get: function() {return this._x;},
        set: function(v) {this._x = v;},
        configurable: true
    });

    Object.defineProperty(Kien.Vector2D.prototype, 'y', {
        get: function() {return this._y;},
        set: function(v) {this._y = v;},
        configurable: true
    });

    Object.defineProperty(Kien.Vector2D.prototype, 'magnitude', {
        get: function() {return this._magnitude()},
        set: function(value) {this.setMagnitude(value)},
        configurable: true
    });

    Kien.Vector2D.prototype.clone = function() {
        var n = new Kien.Vector2D();
        n.x = this.x;
        n.y = this.y;
        return n;
    }

    Kien.Vector2D.prototype._magnitude = function() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    Kien.Vector2D.prototype.applyMagnitude = function(mag) {
        this.x *= mag;
        this.y *= mag;
        return this;
    }

    Kien.Vector2D.prototype.dot = function(other) {
        return this.x*other.x + this.y*other.y;
    }

    Kien.Vector2D.prototype.clockwise = function(other) {
        return this.y*other.x > this.x*other.y ? -1 : 1;
    }

    Kien.Vector2D.prototype.crossProduct = function() {
        var vec = this.clone();
        vec.x = this.y;
        vec.y = -this.x;
        return vec;
    }

    Kien.Vector2D.prototype.angleBetween = function(other) {
        if (this.magnitude === 0 || other.magnitude === 0) {
            return 0;
        }

        var val = this.dot(other) / (this.magnitude * other.magnitude);
        return Math.acos(Math.max(Math.min(1, val), -1));
    }

    Kien.Vector2D.prototype.setMagnitude = function(mag) {
        if (this.magnitude != 0) {
            return this.applyMagnitude(1/this.magnitude).applyMagnitude(mag);
        } else {
            return this;
        }
    }

    Kien.Vector2D.prototype.unit = function() {
        if (this.magnitude !== 0) {
            return this.clone().applyMagnitude(1/this.magnitude);
        } else {
            return this.clone();
        }
    }

    Kien.Vector2D.prototype.translatePoint = function(point) {
        point.x += this.x;
        point.y += this.y;
        return point;
    }

    Kien.Vector2D.prototype.setAngle = function(angle) {
        var mag = this.magnitude;
        this.x = Math.cos(angle);
        this.y = Math.sin(angle);
        return this.setMagnitude(mag);
    }

    Kien.Vector2D.prototype.turn = function(angle, dir) {
        var mag = this.magnitude
        var c = Math.cos(angle);
        var s = Math.sin(angle) * (!!dir ?  dir : 1);
        var x = this.x;
        var y = this.y;
        this.x = Math.roundAt(c * x - s * y, 5);
        this.y = Math.roundAt(s * x + c * y, 5);
        this.setMagnitude(mag);
        return this;
    }

    Kien.Vector2D.prototype.subtract = function(other) {
        return new Kien.Vector2D(this.x - other.x, this.y - other.y);
    }

    Kien.Vector2D.prototype.add = function(other) {
        return new Kien.Vector2D(this.x + other.x, this.y + other.y);
    }

    Kien.Vector2D.prototype.turnTo = function(other) {
        var mag = this.magnitude;
        var tu = this.unit();
        var ou = other.unit();
        var c = tu.dot(other);
        var s = tu.x*ou.y - ou.x*tu.y;
        var x = this.x;
        var y = this.y;
        this.x = Math.roundAt(c * x - s * y, 5);
        this.y = Math.roundAt(s * x + c * y, 5);
        return this;
    }

    Kien.Vector2D.getDisplacementVector = function(w,x,y,z) {
        if (y === undefined && z === undefined) {
            z = x.x;
            y = x.y;
            x = w.y;
            w = w.x;
        }
        return (new Kien.Vector2D(y-w, z-x));
    }
    
    Kien.Vector2D.getDirectionVector = function(w,x,y,z) {
        return this.getDisplacementVector(w,x,y,z).unit();
    }

    Kien.Vector2D.xUnitVector = new Kien.Vector2D(1,0);
    Kien.Vector2D.yUnitVector = new Kien.Vector2D(0,1);

}

//-----------------------------------------------------------------------------
// Array
//
// Define a utility Function.

if (!Array.prototype.find) {

    Object.defineProperty(Array.prototype, "find", {
        value: function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        }
    });
}

if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, "findIndex", {
        value: function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return i;
                }
            }
        return -1;
        }
    });
}

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, "find", {
        value: function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        }
    });
}

if (!Array.prototype.sample) {
    Object.defineProperty(Array.prototype, "sample", {
        value: function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.sample called on null or undefined');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var value;
            if (length === 0){
                return undefined;
            }
            var index = Math.floor( Math.random() * length);
            return list[index];
        }
    });
}

if (!Array.prototype.clear) {
    Object.defineProperty(Array.prototype, "clear", {
        value: function() {
            this.splice(0,this.length);
        }
    });
}


if (!Math.deg2Rad) {
    Math.deg2Rad = function(degree) {
        return (((degree % 360) + 360) % 360) * Math.PI / 180;
    }
}

if (!Math.rad2Deg) {
    Math.rad2Deg = function(radian) {
        return ((((radian / Math.PI) * 180) % 360 ) + 360) % 360;
    }
}

if (!Math.roundAt) {
    Math.roundAt = function(num, digit) {
        return Math.round(num * Math.pow(10, digit)) / Math.pow(10, digit);
    }
}

if (!Number.prototype.between) {
	Number.prototype.between = function(a, b, inclusive) {
	  var min = Math.min(a, b),
	    max = Math.max(a, b);

	  return inclusive ? this >= min && this <= max : this > min && this < max;
	}
}

if (!Kien.cloneEvent) {
	// from http://stackoverflow.com/questions/12593035/cloning-javascript-event-object
	Kien.cloneEvent = function(e) {
	    if (e===undefined || e===null) return undefined;
	    function ClonedEvent() {};  
	    var clone = new ClonedEvent();
	    for (var p in e) {
	        var d = Object.getOwnPropertyDescriptor(e, p);
	        if (d && (d.get || d.set)) Object.defineProperty(clone, p, d); else clone[p] = e[p];
	    }
	    Object.setPrototypeOf(clone, e);
	    return clone;
	}
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

if (!Kien.HashMap) {

    Kien.HashMap = function() {
        this.hashes = {};
        this._keys = [];
    }

    Kien.HashMap.prototype.put = function( key, value ) {
        if (value === null || value === undefined) {
            this.remove(key);
        } else {
            if (!this._keys.contains(key)) {
                this._keys.push(key);
            }
            this.hashes[key] = value;
        }
    }

    Kien.HashMap.prototype.get = function(key) {
        return this.hashes[key];
    },

    Kien.HashMap.prototype.keys = function() {
        return this._keys.clone();
    },

    Kien.HashMap.prototype.remove = function(key) {
        if (this._keys.contains(key)) {
            this._keys.splice(this._keys.indexOf(key), 1);
            delete this.hashes[key];
        }
    }
}
