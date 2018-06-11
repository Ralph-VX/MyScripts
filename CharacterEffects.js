//=============================================================================
// Character Effects
// CharacterEffects.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_CharacterShake = true;

var Kien = Kien || {};
Kien.CharacterEffects = {};
//=============================================================================
/*:
 * @plugindesc Allow you to Use Various Effects on Character.
 * @author Kien
 * @help
*/

//-----------------------------------------------------------------------------
// Game_Screen
//
// The game object class for screen effect data, such as changes in color tone
// and flashes.

Game_Screen.prototype.pictureFollow = function(pictureId,eventId) {
    this.picture(pictureId).followEvent(eventId);
};

//-----------------------------------------------------------------------------
// Game_Picture
//
// The game object class for a picture.

Game_Picture.prototype.followEvent = function(eventId){
    this._followingEventId = eventId;
    if (this._followingEventId > 0){
        var e = $gameMap.event(eventId);
        this._followingLastX = e.screenX();
        this._followingLastY = e.screenY();
    } else {
        this._followingLastX = 0;
        this._followingLastY = 0;
    }
}

Kien.CharacterEffects.Game_Picture_updateMove = Game_Picture.prototype.updateMove;
Game_Picture.prototype.updateMove = function() {
	Kien.CharacterEffects.Game_Picture_updateMove.apply(this, arguments);
    if (this._followingEventId > 0){
        var e = $gameMap.event(this._followingEventId);
        var cx = e.screenX();
        var cy = e.screenY();
        this._x += cx - this._followingLastX;
        this._y += cy - this._followingLastY;
        this._followingLastX = cx;
        this._followingLastY = cy;
    }
};

//-----------------------------------------------------------------------------
// Game_Character
//
// The superclass of Game_Player, Game_Follower, GameVehicle, and Game_Event.

Kien.CharacterEffects.Game_Character_initMembers = Game_Character.prototype.initMembers;
Game_Character.prototype.initMembers = function() {
	Kien.CharacterEffects.Game_Character_initMembers.apply(this, arguments);
    this.clearShake();
    this.yOffset = 0;
    this.yOffsetTarget = 0;
    this.xOffset = 0;
    this.xOffsetTarget = 0;
    this.offsetDuration = 0;
    this.heightOff = 0;
    this.heightOffTarget = 0;
    this.yStart = 0;
    this.yStartTarget = 0;
    this.yStartDuration = 0;
    this.heightOffDuration = 0;
}

Game_Character.prototype.clearShake = function() {
    this._shakePower = 0;
    this._shakeSpeed = 0;
    this._shakeDuration = 0;
    this._shakeDirection = 1;
    this._shake = 0;
};

Kien.CharacterEffects.Game_Character_update = Game_Character.prototype.update;
Game_Character.prototype.update = function() {
    Kien.CharacterEffects.Game_Character_update.apply(this, arguments);
    this.updateShake();
    this.updateHeightOff();
    this.updateYStart();
    this.updateOffset();
};

Game_Character.prototype.updateShake = function() {
    if (this._shakeDuration > 0 || this._shake !== 0) {
        var delta = (this._shakePower * this._shakeSpeed * this._shakeDirection) / 10;
        if (this._shakeDuration <= 1 && this._shake * (this._shake + delta) < 0) {
            this._shake = 0;
        } else {
            this._shake += delta;
        }
        if (this._shake > this._shakePower * 2) {
            this._shakeDirection = -1;
        }
        if (this._shake < - this._shakePower * 2) {
            this._shakeDirection = 1;
        }
        this._shakeDuration--;
    }
};

Game_Character.prototype.updateHeightOff = function(){
    if(this.heightOffDuration > 0){
        this.heightOff += (this.heightOffTarget - this.heightOff) / this.heightOffDuration;
        this.heightOffDuration--;
    }
}

Game_Character.prototype.updateYStart = function() {
    if (this.yStartDuration > 0) {
        this.yStart += (this.yStartTarget - this.yStart) / this.yStartDuration;
        this.yStartDuration--;
    }
}

Game_Character.prototype.updateOffset = function() {
    if (this.offsetDuration > 0) {
        this.xOffset += (this.xOffsetTarget - this.xOffset) / this.offsetDuration;
        this.yOffset += (this.yOffsetTarget - this.yOffset) / this.offsetDuration;
        this.offsetDuration--;
    }
}

Game_Character.prototype.heightOffTo = function(target,duration){
    this.heightOffDuration = duration;
    this.heightOffTarget = target;
}

Game_Character.prototype.yStartTo = function(target, duration) {
    this.yStartTo = target;
    this.yStartDuration = duration;
}

Game_Character.prototype.offsetTo = function(x,y,duration) {
    this.xOffsetTarget = x != undefined ? x : this.xOffsetTarget;
    this.yOffsetTarget = y != undefined ? y : this.yOffsetTarget;
    this.offsetDuration = duration;
}

Game_Character.prototype.startShake = function(power, speed, duration) {
    this._shakePower = power;
    this._shakeSpeed = speed;
    this._shakeDuration = duration;
};

//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Kien.CharacterEffects.Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function() {
    Kien.CharacterEffects.Game_Event_setupPageSettings.apply(this, arguments);
    var comment = this.firstComments();
    if (comment.match(/<offset ([+-]?\d+),([+-]?\d+)>/i)) {
        this.xOffset = this.xOffsetTarget = parseInt(RegExp.$1);
        this.yOffset = this.yOffsetTarget = parseInt(RegExp.$2);
    } else {
        this.xOffset = this.xOffsetTarget = 0;
        this.yOffset = this.yOffsetTarget = 0;
    }
    if (comment.match(/<heightoff ([+-]?\d+)/i)) {
        this.heightOff = this.heightOffTarget = parseInt(RegExp.$1);
    } else {
        this.heightOff = this.heightOffTarget = 0;
    }
    if (comment.match(/<ystart ([+-]?\d+)/i)) {
        this.yStart = this.yStartTarget = parseInt(RegExp.$1);
    } else {
        this.yStart = this.yStartTarget = 0;
    }
};

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Sprite_Character.prototype.updateCharacterFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sx = (this.characterBlockX() + this.characterPatternX()) * pw;
    var sy = (this.characterBlockY() + this.characterPatternY()) * ph;
    var ho = this._character.heightOff;
    var ys = this._character.yStart;
    this.updateHalfBodySprites();
    if (this._bushDepth > 0) {
        var d = this._bushDepth;
        if (ho > d) {
            var h = ph - ys - ho > 0 ? ph - ys - ho : 0;
            this._lowerBody.setFrame(0, 0, 0, 0);
            this._upperBody.setFrame(sx, sy + ys, pw, h);
        } else {
            if (ys > ph - d) {
                var l = ph-ys-ho > 0 ? ph-ys-ho : 0;
                this._upperBody.setFrame(sx, sy+ys, pw, 0);
                this._lowerBody.setFrame(sx, sy + ph - l, pw, l)
            } else {
                this._upperBody.setFrame(sx, sy+ys, pw, ph - d - ys);
                this._lowerBody.setFrame(sx, sy + ph - d, pw, d-ho);
            }
        }
        this.setFrame(sx, sy, 0, ph);
    } else {
        var l = ph-ys-ho > 0 ? ph-ys-ho : 0;
        this.setFrame(sx, sy+ys, pw, l);
    }
};

Sprite_Character.prototype.updateTileFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sx = (Math.floor(this._tileId / 128) % 2 * 8 + this._tileId % 8) * pw;
    var sy = Math.floor(this._tileId % 256 / 8) % 16 * ph;
    var ho = this._character.heightOff;
    var ys = this._character.yStart;
    var l = ph-ys-ho > 0 ? ph-ys-ho : 0;
    this.setFrame(sx, sy+ys, pw, l);
};

Sprite_Character.prototype.updatePosition = function() {
    this.x = this._character.screenX() + this._character._shake + this._character.xOffset;
    this.y = this._character.screenY() - this._character.heightOff + this._character.yOffset;
    this.z = this._character.screenZ();
};
