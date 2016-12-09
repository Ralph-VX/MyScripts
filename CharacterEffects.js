//=============================================================================
// Character Effects
// CharacterEffects.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_CharacterShake = true;

var Kien = Kien || {};
Kien.CharacterShake = {};
//=============================================================================
/*:
 * @plugindesc Allow you to Use Various Effects on Character.
 * @author Kien
 * @help
 *
 * Plugin Command:
 *  CharacterShake power speed duration isVertical event
 *     power: power of the shake. Same as Event Command.
 *     speed: speed of the shake. Same as Event Command.
 *     duration: duration of the shake. Same as Event Command.
 *     isVertical: 1 for vertical shake, 0 horizontal.
 *     event: Event ID of the event this command targeting. 0 for current, -1 for player.
 *       Let a specified character to shake. Use same algorithm as the Screen Shake event command.
 *
*/

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.


Kien.CharacterShake.Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
	Kien.CharacterShake.Game_CharacterBase_initMembers.call(this);
	this.kienClearEffect();
}

Game_CharacterBase.prototype.kienClearEffect = function() {
	this._kienEffect = [];
}

Game_CharacterBase.prototype.kienStartShake = function(power, speed, dur, vert) {
	this._kienEffect.push({
		type : "shake",
		power :power,
		speed :power,
		duration :dur,
		vertical :vert,
		shake: 0,
		direction: 1
	});
}

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

Kien.CharacterShake.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Kien.CharacterShake.Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === 'CharacterShake') {
		var power = parseInt(args[0]);
		var speed = parseInt(args[1]);
		var dur = parseInt(args[2]);
		var vert = parseInt(args[3]);
		var event = args[4] ? this.character(parseInt(args[4])) : this.character(0);
		event.kienStartShake(power,speed,dur,vert);
	}
};
//-----------------------------------------------------------------------------
// Sprite_Base
//
// The sprite class with a feature which displays animations.

Kien.CharacterShake.Sprite_Base_initialize = Sprite_Base.prototype.initialize;
Sprite_Base.prototype.initialize = function() {
	Kien.CharacterShake.Sprite_Base_initialize.call(this);
	this._kienEffect = [];
	this.clearKienEffect();
};

Sprite_Base.prototype.clearKienEffect = function() {
	this._kienShakeEffect = {
		x :0,
		y :0
	}
}

Kien.CharacterShake.Sprite_Base_update = Sprite_Base.prototype.update;
Sprite_Base.prototype.update = function() {
	Kien.CharacterShake.Sprite_Base_update.call(this);
	this.updateEffect();
};

Sprite_Base.prototype.updateEffect = function() {
	this.resotreKienEffect();
	this.clearKienEffect();
	for (var n = 0; n < this._kienEffect.length; n++) {
		var obj = this._kienEffect[n];
		if (obj.type == "shake") {
			var _shakePower = obj.power;
			var _shakeSpeed = obj.speed;
			var _shakeDuration = obj.duration;
			var _shakeDirection = obj.direction;
			var _shake = obj.shake;
			var delta = (_shakePower * _shakeSpeed * _shakeDirection) / 10;
			if (_shakeDuration <= 1 && _shake * (_shake + delta) < 0) {
				_shake = 0;
			} else {
				_shake += delta;
			}
			if (_shake > _shakePower * 2) {
				obj.duration = -1;
			}
			if (_shake < - _shakePower * 2) {
				obj.duration = 1;
			}
			obj.duration--;
			obj.shake = _shake;
			if (obj.vertical) {
				this._kienShakeEffect.y += _shake;
			} else {
				this._kienShakeEffect.x += _shake;
			}
		}
	}
	this.applyKienEffect();
    var callback = function(s) {
        return s.duration === 0;
    }
    var i = this._kienEffect.findIndex(callback);
    while (i >= 0) {
    	var o = this._kienEffect[i];
    	this.onEffectFinish(o);
        this._kienEffect.splice(i, 1);
        i = this._kienEffect.findIndex(callback);
    }
}

Sprite_Base.prototype.resotreKienEffect = function() {
	this.x -= this._kienShakeEffect.x;
	this.y -= this._kienShakeEffect.y;
}

Sprite_Base.prototype.applyKienEffect = function() {
	this.x += this._kienShakeEffect.x;
	this.y += this._kienShakeEffect.y;
}

Sprite_Base.prototype.onEffectFinish = function(object) {

}

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Sprite_Character.prototype.updateEffect = function() {
	this._kienEffect = this._kienEffect.concat(this._character._kienEffect);
	this._character.kienClearEffect();
	Sprite_Base.prototype.updateEffect.call(this);
};


