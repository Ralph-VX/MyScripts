//=============================================================================
// Generate Event Randomly for Multilayer Map
// GenerateEventForMultilayer.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_GenerateEventForMultilayerMap = true;

var Kien = Kien || {};
Kien.GEFMMS = {};
//=============================================================================
/*:
 * @plugindesc Add Event generating feature for multilayer map.
 * @author Kien
 *
 * @help
 *
 * 
*/

if (!Imported.Kien_MultilayerMap) {
	throw new Error("No Prerequired Plugin.")
}

//-----------------------------------------------------------------------------
// Game_Map
//
// The game object class for a map. It contains scrolling and passage
// determination functions.

Kien.GEFMMS.Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
	this._generatedEvents = {};
	Kien.GEFMMS.Game_Map_initialize.apply(this, arguments);
};

Game_Map.prototype.clearGeneratedEvent = function() {
	this._generatedEvents = {};
}

Kien.GEFMMS.Game_Map_setupEvents = Game_Map.prototype.setupEvents;
Game_Map.prototype.setupEvents = function() {
	Kien.GEFMMS.Game_Map_setupEvents.apply(this, arguments);
	var zs = this.getCurrentLayers();
	this._needRefreshEvent = {};
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var mapId = DataManager._layerData[z];
		if (this._generatedEvents[mapId]) {
			for (var i = 0; i < this._generatedEvents[mapId].length; i++) {
				var e = this._generatedEvents[mapId][i];
				this._events[mapId][e._eventId] = e;
			}
		} else {
			this._generatedEvents[mapId] = [];
			var mapData = this.mapData(mapId);
			var pnames = Object.keys(mapData.meta).filter(function(name) { 
				return name.match(/GenerateEvent (\d+)/);}
			);
			this._needRefreshEvent[mapId] = false;
			$gameSystem._generatedMapId
			for (var i = 0; i < pnames.length; i++) {
				var name = pnames[i];
				name.match(/GenerateEvent (\d+)/);
				var rid = parseInt(RegExp.$1, 10);
				var params = mapData.meta[name].split(",");
				var redirectEvent = mapData.events[parseInt(params[0], 10)];
				var per = parseFloat(params[1]);
				var max = Infinity;
				if (params.length > 2) {
					max = parseInt(params[2], 10);
				}
				var eid = this.getMaxEventId(mapId);
				var xys = this.getRegionXys(rid, mapId);
				for (var ii = 0; ii < xys.length; ii++) {
					if (eid >= (z+1)*Kien.MMS.maxEventInLayer) {
						break;
					}
					var xy = xys[ii];
					if (Math.random() < per && this.eventsXy(xy.x, xy.y, mapId).length == 0) {
						this._events[mapId][eid] = new Game_Event(mapId, eid);
						this._events[mapId][eid]._srcEvent = redirectEvent;
						this._events[mapId][eid].event = function() {
							return this._srcEvent;
						}
						this._events[mapId][eid].refresh();
						this._events[mapId][eid].locate(xy.x, xy.y);
						this._generatedEvents[mapId].push(this._events[mapId][eid]);
						eid++;
					}
				}
			}
		}
	}
};

Game_Map.prototype.addEvent = function(mapId, sourceEventId, x, y) {
	if (this._events[mapId] && this._events[mapId][sourceEventId]) {
		var redirectEvent = this.mapData(mapId).events[sourceEventId];
		var eid = this.getMaxEventId(mapId);
		this._events[mapId][eid] = new Game_Event(mapId, eid);
		this._events[mapId][eid].event = function(){
			return redirectEvent;
		}
		this._events[mapId][eid].refresh();
		this._events[mapId][eid].locate(x, y);
		this._needRefreshEvent[mapId] = true;
	}
}

Game_Map.prototype.addEventByObject = function(mapId, sourceEvent, x, y) {
	if (this._events[mapId] && sourceEvent) {
		var redirectEvent = sourceEvent;
		var eid = this.getMaxEventId(mapId);
		this._events[mapId][eid] = new Game_Event(mapId, eid);
		this._events[mapId][eid].event = function(){
			return redirectEvent;
		}
		this._events[mapId][eid].refresh();
		this._events[mapId][eid].locate(x, y);
		this._needRefreshEvent[mapId] = true;
	}
}

Game_Map.prototype.getMaxEventId = function(mapId) {
	var end = Kien.MMS.maxEventInLayer;
	for (var eid = Kien.MMS.maxEventInLayer - 1; eid >= 1; eid--) {
		if (this._events[mapId][eid] != null) {
			return eid + 1;
		}
	}
	return eid;
}

Game_Map.prototype.getRegionXys = function(regionId, mapId) {
	var ret = [];
	for (var x = 0; x < this.width();x++) {
		for (var y = 0; y < this.height();y++) {
			if (this.regionId(x,y, mapId) == regionId) {
				ret.push({x:x, y:y});
			} 
		}
	}
	return ret;
}

Game_Event._emptyEvent = {
	"x" : -1,
	"y" : -1,
	"pages" : [],
}

Kien.GEFMMS.Game_Event_event = Game_Event.prototype.event;
Game_Event.prototype.event = function() {
	if (this._srcEvent) {
		return this._srcEvent;
	}
    var ret = Kien.GEFMMS.Game_Event_event.apply(this, arguments);
    return ret ? ret : Game_Event._emptyEvent;
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

Game_Interpreter.prototype.createEvent = function(mapId, sourceEventId, x, y) {
	$gameMap.addEvent(eval(mapId), eval(sourceEventId), eval(x), eval(y));
}

Kien.lib.addPluginCommand("GEM_AddEvent", 	Game_Interpreter.prototype.createEvent);

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

Spriteset_Map._layerContents.push("_characterEvents");

Spriteset_Map.prototype.createCharacters = function() {
	mapId = this._workingMapId;
    this._characterSprites = [];
    this._characterEvents = [];
    $gameMap.eventsInMapId(mapId).forEach(function(event) {
        this._characterSprites.push(new Sprite_Character(event));
        this._characterEvents.push(event);
    }, this);
    $gameMap.vehicles().forEach(function(vehicle) {
    	if (vehicle._mapId == mapId) {
        	this._characterSprites.push(new Sprite_Character(vehicle));
    	}
    }, this);
    $gamePlayer.followers().reverseEach(function(follower) {
    	if ($gamePlayer._mapId == mapId) {
        	this._characterSprites.push(new Sprite_Character(follower));
    	}
    }, this);
    if ($gamePlayer._mapId == mapId) {
    	this._characterSprites.push(new Sprite_Character($gamePlayer));
    }
    for (var i = 0; i < this._characterSprites.length; i++) {
        this._tilemap.addChild(this._characterSprites[i]);
    }
};

Spriteset_Map.prototype.update = function() {
    Spriteset_Base.prototype.update.call(this);
	var zs = $gameMap.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var baseSprite = this._baseSprite;
	    for (var ci = 0; ci < Spriteset_Map._layerContents.length; ci++) {
	    	var name = Spriteset_Map._layerContents[ci];
	    	this[name] = this._layerContainers[z][name];
	    }
		this._workingMapId = DataManager._layerData[z];
	    this.updateTileset();
	    this.updateParallax();
	    this.updateTilemap();
	    this.updateShadow();
	    this.updateCharacter();
	    for (var ci = 0; ci < Spriteset_Map._layerContents.length; ci++) {
	    	var name = Spriteset_Map._layerContents[ci];
	    	this._layerContainers[z][name] = this[name];
	    }
	    this._baseSprite = baseSprite;
	}
	this.updateCharacterLayerMovement();
    this.updateWeather();
};

Spriteset_Map.prototype.updateCharacter = function() {
	mapId = this._workingMapId;
	if ($gameMap._needRefreshEvent[mapId]) {
	    $gameMap.eventsInMapId(mapId).forEach(function(event) {
	    	if (!this._characterEvents.contains(event)) {
	    		var sprite = new Sprite_Character(event);
		        this._characterSprites.push(sprite);
        		this._tilemap.addChild(sprite);
		        this._characterEvents.push(event);
	    	}
	    }, this);
	    $gameMap._needRefreshEvent[mapId] = false;
	}
}