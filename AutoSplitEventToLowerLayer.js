//=============================================================================
// AutoSplitEventToLowerLayer
// AutoSplitEventToLowerLayer.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_AutoSplitEventToLowerLayer = true;

var Kien = Kien || {};
Kien.ASETLL = {};
//=============================================================================
/*:
 * @plugindesc Add Comment mark to automatically add lower layer event.
 * @author Kien
 *
 * @help
 *   require CharacterEffects.js and MultilayerMap.js.
 * 
*/

if (!Imported.Kien_MultilayerMap || !Imported.Kien_CharacterShake) {
	throw new Error("Required Plugin Not Found.");
}

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

Game_CharacterBase.prototype.copyAll = function(character) {
	this.copyPosition(character);
    this._tileId = character._tileId;
    this._characterName = character._characterName;
    this._characterIndex = character._characterIndex;
    this._isObjectCharacter = character._isObjectCharacter;
    this._walkAnime = character._walkAnime;
    this._stepAnime = character._stepAnime;
    this._directionFix = character._directionFix;
    this._through = character._through;
    this._transparent = character._transparent;
};

//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Game_Event._emptyEvent = {
	"x" : -1,
	"y" : -1,
	"pages" : [],
}

Kien.ASETLL.Game_Event_event = Game_Event.prototype.event;
Game_Event.prototype.event = function() {
    var ret = Kien.ASETLL.Game_Event_event.apply(this, arguments);
    return ret ? ret : Game_Event._emptyEvent;
};

Kien.ASETLL.Game_Event_initMembers = Game_Event.prototype.initMembers;
Game_Event.prototype.initMembers = function() {
	Kien.ASETLL.Game_Event_initMembers.apply(this, arguments);
	this._isSplited = false;
	this._splitEvent = null;
};

Game_Event.prototype.isSplited = function() {
	return this._isSplited;
}

Game_Event.prototype.splitEvent = function() {
	return this._splitEvent;
}

Kien.ASETLL.Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function() {
	Kien.ASETLL.Game_Event_setupPageSettings.apply(this, arguments);
	var comments = this.firstComments();
	if (comments.match(/<split (\d+)>/)) {
		this.split(parseInt(RegExp.$1));
	} else {
		this.desplit();
	}
};

Game_Event.prototype.split = function(height) {
	var lowerLayer = $gameMap.getPreviousLayer($gameMap.mapIdToLayerIndex(this._mapId));
	if (lowerLayer) {
		var lowerMapId = DataManager._layerData[lowerLayer];
		this._isSplited = true;
		if (this._splitEvent == null) {
			this._splitEvent = new Game_Event(lowerMapId, 0);
		}
		this.heightOff = this.heightOffTarget = height;
		this._splitEvent.copyAll(this);
	}
}

Game_Event.prototype.desplit = function() {
	if (this._isSplited) {
		this._isSplited = false;
		this._splitEvent = null;
		this.heightOff = this.heightOffTarget = 0;
	}
}

Kien.ASETLL.Game_Event_update = Game_Event.prototype.update;
Game_Event.prototype.update = function() {
	Kien.ASETLL.Game_Event_update.apply(this, arguments);
	this.updateSplit();
}

Game_Event.prototype.updateSplit = function() {
	if (this._isSplited) {
		this._splitEvent.copyAll(this);
		this._splitEvent.xOffset = this._splitEvent.xOffsetTarget = this.xOffset;
		this._splitEvent.yOffset = this._splitEvent.yOffsetTarget = this.yOffset;
		this._splitEvent._mapId = DataManager._layerData[$gameMap.getPreviousLayer($gameMap.mapIdToLayerIndex(this._mapId))];
	}
}

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Kien.ASETLL.Sprite_Character_initMembers = Sprite_Character.prototype.initMembers;
Sprite_Character.prototype.initMembers = function() {
	Kien.ASETLL.Sprite_Character_initMembers.apply(this, arguments);
	this._splitSprite = null;
}

Kien.ASETLL.Sprite_Character_update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
	Kien.ASETLL.Sprite_Character_update.apply(this, arguments);
	this.updateSplitSprite();
}

Sprite_Character.prototype.updateSplitSprite = function() {
	if (!!SceneManager._scene._spriteset) {
		if (this._character._isSplited && this._splitSprite == null) {
			var char = this._character._splitEvent;
			var layerIndex = $gameMap.mapIdToLayerIndex(char._mapId);
			this._splitSprite = new Sprite_Character(char);
			var tilemap = SceneManager._scene._spriteset.getLayerTilemap(layerIndex);
			if (tilemap) {
				tilemap.addChild(this._splitSprite);
			}
		} else if (!this._character._isSplited && this._splitSprite) {
			this._splitSprite.parent.removeChild(this._splitSprite);
			this._splitSprite = null;
		}
	}
}