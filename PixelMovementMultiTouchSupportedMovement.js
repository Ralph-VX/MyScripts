//=============================================================================
// Virtual Pad for PixelMovement.js and MultiTouchSupported.js
// PixelMovementMultiTouchSupportedMovement.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_PixelMovementMultiTouchSupportedMovement = true;

var Kien = Kien || {};
Kien.PMMTSM = {};

//=============================================================================
/*:
 * @plugindesc For better control with your finger (and maybe with your mouse).
 * @author Kien
 *
 * @param Minimum Distance
 * @desc Minimum distance in tile the touch point required to move for start to move.
 * @default 0.1
 *
 * @param Maximum Distance
 * @desc Maximum distance in tilethe touch point will react.
 * When distance is at this value, move speed is equal dash distance.
 * @default 1
 *
*/

Kien.PMMTSM.parameters = PluginManager.parameters("PixelMovementMultiTouchSupportedMovement");
Kien.PMMTSM.minimumDistance = parseFloat(Kien.PMMTSM.parameters["Minimum Distance"]);
Kien.PMMTSM.maximumDistance = parseFloat(Kien.PMMTSM.parameters["Maximum Distance"]);


if (!Imported.Kien_MultiTouchSupport || !Imported.Kien_PixelMovement) {
	throw new Error("No Prerequired Plugins.");
}

Kien.PMMTSM.Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
	Kien.PMMTSM.Game_Temp_initialize.call(this);
	this._mapInitTouchCoord = null;
};

Game_Player.prototype.moveByInput = function() {
    if (!this.isMoving() && this.canMove()) {
        var direction = this.getInputDirection();
        if (direction > 0) {
            $gameTemp.clearDestination();
        } else if ($gameTemp.isDestinationValid()){
            var dis = this.distancePerFrame();
            var x = $gameTemp.destinationX();
            var y = $gameTemp.destinationY();
            var sx = $gameMap.canvasToMapX($gameTemp._mapInitTouchCoord.x);
            var sy = $gameMap.canvasToMapY($gameTemp._mapInitTouchCoord.y);
            if ($gameSystem._pixelMoveEnabled) {
                var vec = Kien.Vector2D.getDisplacementVector(sx,sy,x,y);
                if (vec.magnitude > Kien.PMMTSM.minimumDistance) {
	                vec.setMagnitude(Math.min(vec.magnitude-Kien.PMMTSM.minimumDistance, Kien.PMMTSM.maximumDistance) / Kien.PMMTSM.maximumDistance);
	                vec.applyMagnitude(dis);
	                this.moveDiagonally(vec.x > 0 ? 6 : (vec.x < 0 ? 4 : 0),vec.y > 0 ? 2 : (vec.y < 0 ? 8 : 0), Math.abs(vec.x), Math.abs(vec.y));
                }
                return;
            } else {
                direction = this.findDirectionTo(x, y);
            }
        }
        if (direction > 0) {
            this.executeMove(direction);
        }
    }
};

Sprite_Destination.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (!TouchInput.isMouse()) {
    	return;
    }
    if ($gameTemp.isDestinationValid()){
        this.updatePosition();
        this.updateAnimation();
        this.visible = true;
    } else {
        this._frameCount = 0;
        this.visible = false;
    }
};


//-----------------------------------------------------------------------------
// Sprite_VirtualPad
//
// The sprite for displaying the destination place of the touch input.

function Sprite_VirtualPad() {
    this.initialize.apply(this, arguments);
}

Sprite_VirtualPad.prototype = Object.create(Sprite.prototype);
Sprite_VirtualPad.prototype.constructor = Sprite_VirtualPad;

Sprite_VirtualPad.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.createChildSprite();
};

Sprite_VirtualPad.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if ($gameTemp._mapInitTouchCoord){
        this.updatePosition();
        this.visible = true;
    } else {
        this._frameCount = 0;
        this.visible = false;
    }
};

Sprite_VirtualPad.prototype.createChildSprite = function() {
	this._backSprite = new Sprite();
	this._backSprite.bitmap = ImageManager.loadSystem("pad-back");
	this._backSprite.x = 0;
	this._backSprite.y = 0;
	this._frontSprite = new Sprite();
	this._frontSprite.bitmap = ImageManager.loadSystem("pad-front");
	this.addChild(this._backSprite);
	this.addChild(this._frontSprite);
};

Sprite_VirtualPad.prototype.updatePosition = function() {
    var mw = $gameMap.tileWidth() * Kien.PMMTSM.maximumDistance;
    var mh = $gameMap.tileHeight() * Kien.PMMTSM.maximumDistance;
    var mm = Math.sqrt(mw*mw+mh*mh);
    this.x = $gameTemp._mapInitTouchCoord.x;
    this.y = $gameTemp._mapInitTouchCoord.y;
    var vec = Kien.Vector2D.getDisplacementVector(this.x,this.y,$gameTemp._mapTouchPoint.x,$gameTemp._mapTouchPoint.y);
    vec.setMagnitude(Math.min(vec.magnitude, mm));
    this._frontSprite.x = vec.x;
    this._frontSprite.y = vec.y;
};

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

Kien.PMMTSM.Spriteset_Map_createDestination = Spriteset_Map.prototype.createDestination;
Spriteset_Map.prototype.createDestination = function() {
	Kien.PMMTSM.Spriteset_Map_createDestination.call(this);
	this._virtualPadSprite = new Sprite_VirtualPad();
	this._virtualPadSprite.z = 9;
	this._tilemap.addChild(this._virtualPadSprite);
};

//-----------------------------------------------------------------------------
// Scene_Map
//
// The scene class of the map screen.

Kien.PMMTSM.Scene_Map_initialize = Scene_Map.prototype.initialize;
Scene_Map.prototype.initialize = function() {
	Kien.PMMTSM.Scene_Map_initialize.call(this);
	this._mapInitTouchCoord = null;
};

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
			this._mapInitTouchCoord = {
				'x' : this._touchPoint.x,
				'y' : this._touchPoint.y
			}
			$gameTemp._mapInitTouchCoord = this._mapInitTouchCoord;
			$gameTemp._mapTouchPoint = this._touchPoint;
		}
	} else
	if (this._touchPoint) {
		if (!this._touchPoint.isTouching()) {
			TouchInput.deallocateTouch(this._touchPoint);
			this._touchPoint = null;
			$gameTemp._mapInitTouchCoord = null;
			$gameTemp.clearDestination();
		} else {
			$gameTemp._mapTouchPoint = this._touchPoint;
			$gameTemp._mapInitTouchCoord = this._mapInitTouchCoord;
		}
	}
};
