//=============================================================================
// Multilayer Map System
// MultilayerMap.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_MultilayerMap = true;

var Kien = Kien || {};
Kien.MMS = {};
//=============================================================================
/*:
 * @plugindesc Allow to Make Maps composed with multiple map data.
 * @author Kien
 *
 * @param Maximum Event in Single Map
 * @desc Use to separate event id in different layer.
 * @default 1000
 * 
 * @help
 *
 * 
*/

Kien.MMS.parameter = PluginManager.parameters("MultilayerMap");
Kien.MMS.maxEventInLayer = parseInt(Kien.MMS.parameter["Maximum Event in Single Map"], 10);


Kien.MMS.mapLayerSet = {};
Kien.MMS.mapIdToLayerIdentifier = {};
Kien.MMS.mapSetStartLoad = false;
Kien.MMS.mapSetLoaded = false;
Kien.MMS.mapLoadErrorHandler = null;
Kien.MMS.mapIdToLayerIndex = [];

Kien.MMS.generateMapSet = function() {
	Kien.MMS.mapLayerSet = {};
	Kien.MMS.mapIdToLayerIdentifier = {};
	Kien.MMS.mapSetLoaded = false;
	Kien.MMS.mapIdToLayerIndex = {};
	this.generateMapSetForMapIndex(1);
}

Kien.MMS.generateMapSetForMapIndex = function(index) {
	if (index === $dataMapInfos.length) {
		Kien.MMS.mapSetLoaded = true;
		return;
	}
	var mapId = $dataMapInfos[index].id;
    var filename = 'Map%1.json'.format(mapId.padZero(3));
	Kien.MMS.mapLoadErrorHandler = ResourceHandler.createLoader('data/' + filename, Kien.MMS.loadDataFile.bind(null, filename, Kien.MMS.onMapFileLoaded.bind(this, index)));
	Kien.MMS.loadDataFile(filename, Kien.MMS.onMapFileLoaded.bind(this, index));
}

Kien.MMS.loadMapDataWithHandler = function(mapId, handler) {
    var filename = 'Map%1.json'.format(mapId.padZero(3));
	Kien.MMS.mapLoadErrorHandler = ResourceHandler.createLoader('data/' + filename, handler);
	Kien.MMS.loadDataFile(filename, handler);
}

Kien.MMS.loadDataFile = function(filename, handler) {
    var xhr = new XMLHttpRequest();
    var url = 'data/' + filename;
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function() {
        if (xhr.status < 400) {
            handler(JSON.parse(xhr.responseText));
        }
    };
    xhr.onerror = Kien.MMS.mapLoadErrorHandler|| function() {
        DataManager._errorUrl = DataManager._errorUrl || url;
    };
    xhr.send();
}

Kien.MMS.onMapFileLoaded = function(index, obj) {
	DataManager.extractMetadata(obj);
	if (obj.meta) {
		var pname = Object.keys(obj.meta).filter(function(name) { return name.startsWith("MapLayer")})[0];
		if (pname) {
			pname.match(/MapLayer (.+)/);
			Kien.MMS.mapLayerSet[RegExp.$1] = Kien.MMS.mapLayerSet[RegExp.$1] || {};
			Kien.MMS.mapLayerSet[RegExp.$1][obj.meta[pname]] = $dataMapInfos[index].id;
			Kien.MMS.mapIdToLayerIdentifier[$dataMapInfos[index].id] = RegExp.$1;
			Kien.MMS.mapIdToLayerIndex[$dataMapInfos[index].id] = obj.meta[pname];
		}
	}
	Kien.MMS.generateMapSetForMapIndex(index+1);
}

//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

DataManager._layerMapData = {};
DataManager._layerData = null;
DataManager._layerIdentifier = null;

Kien.MMS.DataManager_loadMapData = DataManager.loadMapData;
DataManager.loadMapData = function(mapId) {
	Kien.MMS.DataManager_loadMapData.apply(this, arguments);
    if (mapId > 0) {
    	var layerId = Kien.MMS.mapIdToLayerIdentifier[mapId];
    	DataManager._layerIdentifier = layerId;
    	if (layerId) {
    		DataManager._layerData = Kien.MMS.mapLayerSet[layerId];
    		DataManager._layerMapData = {};
    		DataManager.loadLayerMatData();
    	} else {
    		DataManager._layerData = {
    			"0" : mapId
    		};
    		DataManager._layerMapData = {};
    		DataManager.loadLayerMatData();
    	}
    }
};

DataManager.loadLayerMatData = function() {
	var zs = Object.keys(DataManager._layerData);
	for (var i = 0; i < zs.length; i++) {
		var z = zs[i];
		var mapId = DataManager._layerData[z];
		Kien.MMS.loadMapDataWithHandler(mapId, DataManager.onLayerMapLoaded.bind(this, z, mapId));
	}
};

DataManager.onLayerMapLoaded = function(z, mapId, mapData) {
	mapData.id = mapId;
	DataManager.extractMetadata(mapData);
	DataManager.onLoad(mapData.events);
	DataManager._layerMapData[mapId] = mapData;
}

Kien.MMS.DataManager_isMapLoaded = DataManager.isMapLoaded;
DataManager.isMapLoaded = function() {
	var zs = Object.keys(DataManager._layerData);
	for (var i = 0; i < zs.length; i++) {
		var data = DataManager._layerMapData[DataManager._layerData[zs[i]]];
		if (!data) {
			return false;
		}
	}
    return Kien.MMS.DataManager_isMapLoaded.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Game_Temp
//
// The game object class for temporary data that is not included in save data.

Kien.MMS.Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
	Kien.MMS.Game_Temp_initialize.apply(this, arguments);
	this._pictureCommandTargetMapId = -1;
};

//-----------------------------------------------------------------------------
// Game_Screen
//
// The game object class for screen effect data, such as changes in color tone
// and flashes.

Kien.MMS.Game_Screen_clearPictures = Game_Screen.prototype.clearPictures;
Game_Screen.prototype.clearPictures = function() {
	Kien.MMS.Game_Screen_clearPictures.apply(this, arguments);
	this._layeredPictures = {};
};

Kien.MMS.Game_Screen_picture = Game_Screen.prototype.picture;
Game_Screen.prototype.picture = function(pictrueId, mapId) {
	if (!$gameParty.inBattle() && mapId > 0 && !!this._layeredPictures[mapId]) {
		var temp = this._pictures;
		this._pictures = this._layeredPictures[mapId];
		var picture = Kien.MMS.Game_Screen_picture.apply(this, arguments);
		this._pictures = temp;
		return picture;
	}
	return Kien.MMS.Game_Screen_picture.apply(this, arguments);
}

Game_Screen.prototype.clearLayeredPictures = function() {
	this._layeredPictures = {};
	if ($gameMap) {
		var mapIds = $gameMap.getCurrentMapIds();
		for (var i = 0; i < mapIds.length; i++) {
			var mapId = mapIds[i];
			this._layeredPictures[mapId] = [];
		}
	}
}

Kien.MMS.Game_Screen_updatePictures = Game_Screen.prototype.updatePictures;
Game_Screen.prototype.updatePictures = function() {
	Kien.MMS.Game_Screen_updatePictures.apply(this, arguments);
	var mapIds = $gameMap.getCurrentMapIds();
	for (var i = 0; i < mapIds.length; i++) {
		var mapId = mapIds[i];
		if (this._layeredPictures[mapId]) {
			this._layeredPictures[mapId].forEach(function(picture) {
		        if (picture) {
		            picture.update();
	        	}
	    	});
		}
	};
};

Kien.MMS.Game_Screen_showPicture = Game_Screen.prototype.showPicture;
Game_Screen.prototype.showPicture = function(pictureId, name, origin, x, y,
                                             scaleX, scaleY, opacity, blendMode) {
	if (!$gameParty.inBattle() && $gameTemp._pictureCommandTargetMapId > 0) {
		var temp = this._pictures;
		this._lastPictureMoved = null;
		this._pictures = this._layeredPictures[$gameTemp._pictureCommandTargetMapId];
		if (this._pictures){
			Kien.MMS.Game_Screen_showPicture.apply(this, arguments);
		}
		$gameTemp._pictureCommandTargetMapId = -1;
		this._pictures = temp;
	} else {
		Kien.MMS.Game_Screen_showPicture.apply(this, arguments);
	}
};

Kien.MMS.Game_Screen_movePicture = Game_Screen.prototype.movePicture;
Game_Screen.prototype.movePicture = function(pictureId, origin, x, y, scaleX,
                                             scaleY, opacity, blendMode, duration) {
	if (!$gameParty.inBattle() && $gameTemp._pictureCommandTargetMapId > 0) {
		var temp = this._pictures;
		this._lastPictureMoved = null;
		this._pictures = this._layeredPictures[$gameTemp._pictureCommandTargetMapId];
		if (this._pictures){
			Kien.MMS.Game_Screen_movePicture.apply(this, arguments);
		}
		$gameTemp._pictureCommandTargetMapId = -1;
		this._pictures = temp;
	} else {
		Kien.MMS.Game_Screen_movePicture.apply(this, arguments);
	}
};

Kien.MMS.Game_Screen_rotatePicture = Game_Screen.prototype.rotatePicture;
Game_Screen.prototype.rotatePicture = function(pictureId, speed) {
	if (!$gameParty.inBattle() && $gameTemp._pictureCommandTargetMapId > 0) {
		var temp = this._pictures;
		this._lastPictureMoved = null;
		this._pictures = this._layeredPictures[$gameTemp._pictureCommandTargetMapId];
		if (this._pictures){
			Kien.MMS.Game_Screen_rotatePicture.apply(this, arguments);
		}
		$gameTemp._pictureCommandTargetMapId = -1;
		this._pictures = temp;
	} else {
		Kien.MMS.Game_Screen_rotatePicture.apply(this, arguments);
	}
};

Kien.MMS.Game_Screen_tintPicture = Game_Screen.prototype.tintPicture;
Game_Screen.prototype.tintPicture = function(pictureId, tone, duration) {
	if (!$gameParty.inBattle() && $gameTemp._pictureCommandTargetMapId > 0) {
		var temp = this._pictures;
		this._lastPictureMoved = null;
		this._pictures = this._layeredPictures[$gameTemp._pictureCommandTargetMapId];
		if (this._pictures){
			Kien.MMS.Game_Screen_tintPicture.apply(this, arguments);
		}
		$gameTemp._pictureCommandTargetMapId = -1;
		this._pictures = temp;
	} else {
		Kien.MMS.Game_Screen_tintPicture.apply(this, arguments);
	}
};

Kien.MMS.Game_Screen_erasePicture = Game_Screen.prototype.erasePicture;
Game_Screen.prototype.erasePicture = function(pictureId) {
	if (!$gameParty.inBattle() && $gameTemp._pictureCommandTargetMapId > 0) {
		var temp = this._pictures;
		this._lastPictureMoved = null;
		this._pictures = this._layeredPictures[$gameTemp._pictureCommandTargetMapId];
		if (this._pictures){
			Kien.MMS.Game_Screen_erasePicture.apply(this, arguments);
			var picture = this._pictures[this.realPictureId(pictureId)];
			this._lastPictureMoved = picture;
		}
		$gameTemp._pictureCommandTargetMapId = -1;
		this._pictures = temp;
	} else {
		Kien.MMS.Game_Screen_erasePicture.apply(this, arguments);
	}
};

//-----------------------------------------------------------------------------
// Game_Picture
//
// The game object class for a picture.

Kien.MMS.Game_Picture_initialize = Game_Picture.prototype.initialize;
Game_Picture.prototype.initialize = function() {
	Kien.MMS.Game_Picture_initialize.apply(this, arguments);
	this._relateToMap = $gameTemp._nextPictureRelateToMap;
	$gameTemp._nextPictureRelateToMap = false;
};

//-----------------------------------------------------------------------------
// Game_Map
//
// The game object class for a map. It contains scrolling and passage
// determination functions.

Kien.MMS.Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
	this._activeLayerIndex = -1;
	this._layerIdentifier = null;
	Kien.MMS.Game_Map_initialize.apply(this, arguments);
    this._tilesetId = {};
    this._parallaxName = {};
    this._parallaxZero = {};
    this._parallaxLoopX = {};
    this._parallaxLoopY = {};
    this._parallaxSx = {};
    this._parallaxSy = {};
    this._parallaxX = {};
    this._parallaxY = {};
    this._battleback1Name = {};
    this._battleback2Name = {};
};

Game_Map.prototype.setup = function(mapId) {
    if (!$dataMap) {
        throw new Error('The map data is not available');
    }
    this._mapId = mapId;
    if (DataManager._layerIdentifier !== this._layerIdentifier || !DataManager._layerIdentifier) {
	    this._displayX = 0;
	    this._displayY = 0;
	    this.setupLayer();
    	this.setupTileset();
	    this.refereshVehicles();
	    this.setupEvents();
	    this.setupScroll();
	    this.setupParallax();
	    this.setupBattleback();
	    this.setupExtraData();
	    $gameScreen.clearLayeredPictures();
    } else {
    	this._activeLayerIndex = this.mapIdToLayerIndex(this._mapId);
    }
    this._needsRefresh = false;
};

Game_Map.prototype.convertEventIndex = function(eventId, mapId) {
	mapId = mapId || this._mapId;
	return eventId + (this.mapIdToLayerIndex(mapId) * Kien.MMS.maxEventInLayer);
}

Game_Map.prototype.event = function(eventId, mapId) {
	mapId = mapId || this._mapId;
	var e = this._events[mapId][eventId];
    if (!e) {
    	var ids = this.getCurrentMapIds();
    	for (var i = 0; i < ids.length; i++) {
    		var mid = ids[i];
    		if (this._events[mid][eventId] && this._events[mid][eventId]._mapId == mapId) {
    			e = this._events[mid][eventId];
    		}
    	}
    }
    return e;
};

Game_Map.prototype.eventsXy = function(x, y, mapId) {
    return this.events().filter(function(event) {
        return event.pos(x, y, mapId);
    });
};

Game_Map.prototype.eventsXyNt = function(x, y, mapId) {
    return this.events().filter(function(event) {
        return event.posNt(x, y, mapId);
    });
};

Game_Map.prototype.tileEventsXy = function(x, y, mapId) {
	if (this.tileEvents) {
	    return this.tileEvents.filter(function(event) {
	        return event.posNt(x, y, mapId);
	    });
	} else {
		return [];
	}
};

Game_Map.prototype.eventIdXy = function(x, y, mapId) {
    var list = this.eventsXy(x, y, mapId);
    return list.length === 0 ? 0 : list[0].eventId();
};

Game_Map.prototype.eraseEvent = function(eventId, mapId) {
    this._events[mapId][eventId].erase();
};

Game_Map.prototype.events = function() {
	var ret = [];
	var zs = this.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var mapId = DataManager._layerData[z];
		for (var i = 0; i < this._events[mapId].length; i++) {
			if (!!this._events[mapId][i]) {
				ret.push(this._events[mapId][i]);
			}
		}
	}
	return ret;
};

Game_Map.prototype.eventsInMapId = function(mapId) {
	var ret = [];
	if (this._events[mapId]) {
		for (var i = 0; i < this._events[mapId].length; i++) {
			if (!!this._events[mapId][i]) {
				ret.push(this._events[mapId][i]);
			}
		}
	}
	return ret;
};

Game_Map.prototype.updateInterpreter = function() {
    for (;;) {
        this._interpreter.update();
        if (this._interpreter.isRunning()) {
            return;
        }
        if (this._interpreter.eventId() > 0) {
            this.unlockEvent(this._interpreter.eventId(), this._interpreter._mapId);
            this._interpreter.clear();
        }
        if (!this.setupStartingEvent()) {
            return;
        }
    }
};

Game_Map.prototype.unlockEvent = function(eventId, mapId) {
    if (this._events[mapId] && this._events[mapId][eventId]) {
        this._events[mapId][eventId].unlock();
    }
};

Game_Map.prototype.changeTileset = function(tilesetId, mapId) {
	mapId = mapId || this._mapId;
    this._tilesetId[mapId] = tilesetId;
    this.refresh();
};

Game_Map.prototype.changeBattleback = function(battleback1Name, battleback2Name, mapId) {
	mapId = mapId || this._mapId;
    this._battleback1Name[mapId] = battleback1Name;
    this._battleback2Name[mapId] = battleback2Name;
};

Game_Map.prototype.changeParallax = function(name, loopX, loopY, sx, sy, mapId) {
	mapId = mapId || this._mapId;
    this._parallaxName[mapId] = name;
    this._parallaxZero[mapId] = ImageManager.isZeroParallax(this._parallaxName[mapId]);
    if (this._parallaxLoopX[mapId] && !loopX) {
        this._parallaxX[mapId] = 0;
    }
    if (this._parallaxLoopY[mapId] && !loopY) {
        this._parallaxY[mapId] = 0;
    }
    this._parallaxLoopX[mapId] = loopX;
    this._parallaxLoopY[mapId] = loopY;
    this._parallaxSx[mapId] = sx;
    this._parallaxSy[mapId] = sy;
};

Game_Map.prototype.setupTileset = function() {
	this._tilesetId = {};
	var mapIds = this.getCurrentMapIds();
	for (var mi = 0; mi < mapIds.length; mi++) {
		var mapId = mapIds[mi];
		var mapData = DataManager._layerMapData[mapId];
		this._tilesetId[mapId] = mapData.tilesetId;
	}
}

Game_Map.prototype.setupParallax = function() {
	this._parallaxName = {};
	this._parallaxZero = {};
	this._parallaxLoopX = {};
	this._parallaxSx = {};
	this._parallaxSy = {};
	this._parallaxX = {};
	this._parallaxY = {};
	var mapIds = this.getCurrentMapIds();
	for (var mi = 0; mi < mapIds.length; mi++) {
		var mapId = mapIds[mi];
		var mapData = DataManager._layerMapData[mapId];
	    this._parallaxName[mapId] = mapData.parallaxName || '';
	    this._parallaxZero[mapId] = ImageManager.isZeroParallax(this._parallaxName[mapId]);
	    this._parallaxLoopX[mapId] = mapData.parallaxLoopX;
	    this._parallaxLoopY[mapId] = mapData.parallaxLoopY;
	    this._parallaxSx[mapId] = mapData.parallaxSx;
	    this._parallaxSy[mapId] = mapData.parallaxSy;
	    this._parallaxX[mapId] = 0;
	    this._parallaxY[mapId] = 0;
	}
};

Game_Map.prototype.setupBattleback = function() {
	var zs = this.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var mapId = DataManager._layerData[z];
		var mapData = this.mapData(mapId);
	    if (mapData.specifyBattleback) {
	        this._battleback1Name[mapId] = mapData.battleback1Name;
	        this._battleback2Name[mapId] = mapData.battleback2Name;
	    }
	}
};

Game_Map.prototype.setupEvents = function() {
    this._events = {};
    this.tileEvents = [];
	var zs = this.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var mapId = DataManager._layerData[z];
		var mapData = this.mapData(mapId);
		this._events[mapId] = [];
		for (var i = 0; i < mapData.events.length; i++) {
			if (mapData.events[i]) {
				this._events[mapId][i] = new Game_Event(mapId, i);
			}
		}
	}
    this._commonEvents = this.parallelCommonEvents().map(function(commonEvent) {
        return new Game_CommonEvent(commonEvent.id);
    });
    this.refreshTileEvents();
};

Game_Map.prototype.setupExtraData = function() {
	this._regionPassageData = {};
	this._regionLayerMovementData = {};
	this._regionSlippingSurface = {};
	var mapIds = this.getCurrentMapIds();
	for (var mi = 0; mi < mapIds.length; mi++) {
		var mapId = mapIds[mi];
		this._regionPassageData[mapId] = {};
		var mapData = DataManager._layerMapData[mapId];
		this._regionLayerMovementData[mapId] = {};
		if (mapData.meta["LayerMovementRegion"]) {
			if (mapData.meta["LayerMovementRegion"].match(/(\d+)(?:\,([2468]+))?/)) {
				this._regionLayerMovementData[mapId][RegExp.$1] = RegExp.$2 || "2468";
			}
		}
		this._regionSlippingSurface[mapId] = mapData.meta["SlippingSurface"] || -1;
		var regions = Object.keys(mapData.meta).filter(function(string) { return string.startsWith("RegionPassage")});
		for (var ri = 0; ri < regions.length; ri++) {
			if (regions[ri].match(/RegionPassage (\d+)/)) {
				var dirs = mapData.meta[regions[ri]];
				var bits = 0;
				if (typeof dirs === "string") {
					if (dirs.contains("2")) {
						bits += 1;
					}
					if (dirs.contains("4")) {
						bits += 1 << 1;
					}
					if (dirs.contains("6")) {
						bits += 1 << 2;
					}
					if (dirs.contains("8")) {
						bits += 1 << 3;
					}
				}
				this._regionPassageData[mapId][RegExp.$1] = bits;
			}
		}
	}
}

Game_Map.prototype.setDisplayPos = function(x, y) {
    if (this.isLoopHorizontal()) {
        this._displayX = x.mod(this.width());
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        this._parallaxX[mapId] = x;
	    }
    } else {
        var endX = this.width() - this.screenTileX();
        this._displayX = endX < 0 ? endX / 2 : x.clamp(0, endX);
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        this._parallaxX[mapId] = this._displayX;
	    }
    }
    if (this.isLoopVertical()) {
        this._displayY = y.mod(this.height());
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        this._parallaxY[mapId] = y;
	    }
    } else {
        var endY = this.height() - this.screenTileY();
        this._displayY = endY < 0 ? endY / 2 : y.clamp(0, endY);
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        this._parallaxY[mapId] = this._displayY;
	    }
    }
};

Game_Map.prototype.getCurrentLayerData = function() {
	return DataManager._layerData;
}

Game_Map.prototype.getCurrentMapIds = function() {
	return this.getCurrentLayers().map(function(z) { return this.getCurrentLayerData()[z]; }.bind(this));
}

Game_Map.prototype.setupLayer = function() {
    this._layerIdentifier = DataManager._layerIdentifier;
    this._activeLayerIndex = this.mapIdToLayerIndex(this._mapId);
}

Game_Map.prototype.getLowerSortedLayer = function(layerIndex) {
	var zs = this.getCurrentLayers();
	return zs.filter(function(v) { return v <= layerIndex}).sort();
}

Game_Map.prototype.getSortedLayer = function() {
	var zs = this.getCurrentLayers();
	return zs.sort();
}

Game_Map.prototype.getNextLayer = function(layerIndex) {
	var zs = this.getSortedLayer();
	if (zs.indexOf(layerIndex) + 1 < 0) {
		return null;
	} else {
		return zs[zs.indexOf(layerIndex) + 1];
	}
}

Game_Map.prototype.getNextMapId = function(mapId) {
	mapId = mapId || this._mapId;
	var layerIndex = this.getNextLayer(this.mapIdToLayerIndex(mapId));
	if (layerIndex) {
		return this.getCurrentLayerData()[layerIndex];
	}
}

Game_Map.prototype.getPreviousLayer = function(layerIndex) {
	var zs = this.getSortedLayer();
	if (zs.indexOf(layerIndex) - 1 < 0) {
		return null;
	} else {
		return zs[zs.indexOf(layerIndex) - 1];
	}
}

Game_Map.prototype.getPreviousMapId = function(mapId) {
	mapId = mapId || this._mapId;
	var layerIndex = this.getPreviousLayer(this.mapIdToLayerIndex(mapId));
	if (layerIndex) {
		return this.getCurrentLayerData()[layerIndex];
	}
}

Game_Map.prototype.mapIdToLayerIndex = function(mapId) {
	mapId = mapId || this._mapId;
	if (!!Kien.MMS.mapIdToLayerIndex[mapId]) {
		return Kien.MMS.mapIdToLayerIndex[mapId];
	} else {
		return Kien.MMS.mapIdToLayerIndex[this._mapId] || 0;
	}
}

Game_Map.prototype.isLayeredMap = function() {
	return !!DataManager._layerIdentifier;
}

Game_Map.prototype.getLayers = function(layerIdentifier) {
	if (Kien.MMS.mapLayerSet[layerIdentifier]) {
		return Object.keys(Kien.MMS.mapLayerSet[layerIdentifier])
	} else {
		return [0];
	}
}

Game_Map.prototype.getCurrentLayers = function() {
	return this.getLayers(this._layerIdentifier);
}

Game_Map.prototype.isMapIdInLayer = function(mapId) {
	return this.getCurrentMapIds().contains(mapId);
}

Game_Map.prototype.mapData = function(mapId) {
	mapId = mapId || this._mapId;
	return DataManager._layerMapData[mapId];
}

Game_Map.prototype.tileset = function(mapId) {
    return $dataTilesets[this.tilesetId(mapId)];
};

Game_Map.prototype.tilesetFlags = function(mapId) {
    var tileset = this.tileset(mapId);
    if (tileset) {
        return tileset.flags;
    } else {
        return [];
    }
};

Game_Map.prototype.tilesetId = function(mapId) {
	mapId = mapId || this._mapId
    return this._tilesetId[mapId];
};

Game_Map.prototype.displayX = function() {
    return this._displayX;
};

Game_Map.prototype.displayY = function() {
    return this._displayY;
};

Game_Map.prototype.parallaxName = function(mapId) {
	mapId = mapId || this._mapId
    return this._parallaxName[mapId];
};

Game_Map.prototype.battleback1Name = function(mapId) {
	mapId = mapId || this._mapId
    return this._battleback1Name[mapId];
};

Game_Map.prototype.battleback2Name = function(mapId) {
	mapId = mapId || this._mapId
    return this._battleback2Name[mapId];
};

Game_Map.prototype.data = function(mapId) {
	return this.mapData(mapId).data;
}

Game_Map.prototype.displayName = function(mapId) {
    return this.mapData(mapId).displayName;
};

Game_Map.prototype.width = function(mapId) {
    return this.mapData(mapId).width;
};

Game_Map.prototype.height = function(mapId) {
    return this.mapData(mapId).height;
};

Game_Map.prototype.isLayerMovementRegion = function(mapId, regionId, direction) {
	if (this._regionLayerMovementData[mapId] && this._regionLayerMovementData[mapId][regionId]) {
		return this._regionLayerMovementData[mapId][regionId].contains(direction);
	}
	return false;
} 

Game_Map.prototype.isLoopHorizontal = function(mapId) {
    return this.mapData(mapId).scrollType === 2 || this.mapData(mapId).scrollType === 3;
};

Game_Map.prototype.isLoopVertical = function(mapId) {
    return this.mapData(mapId).scrollType === 1 || this.mapData(mapId).scrollType === 3;
};

Game_Map.prototype.isDashDisabled = function(mapId) {
    return this.mapData(mapId).disableDashing;
};

Game_Map.prototype.encounterList = function(mapId) {
    return this.mapData(mapId).encounterList;
};

Game_Map.prototype.encounterStep = function(mapId) {
    return this.mapData(mapId).encounterStep;
};

Game_Map.prototype.parallaxOx = function(mapId) {
	mapId = mapId || this._mapId
    if (this._parallaxZero[mapId]) {
        return this._parallaxX[mapId] * this.tileWidth();
    } else if (this._parallaxLoopX[mapId]) {
        return this._parallaxX[mapId] * this.tileWidth() / 2;
    } else {
        return 0;
    }
};

Game_Map.prototype.parallaxOy = function(mapId) {
	mapId = mapId || this._mapId
    if (this._parallaxZero[mapId]) {
        return this._parallaxY[mapId] * this.tileHeight();
    } else if (this._parallaxLoopY[mapId]) {
        return this._parallaxY[mapId] * this.tileHeight() / 2;
    } else {
        return 0;
    }
};

Game_Map.prototype.checkPassage = function(x, y, bit, mapId) {
	// Regional Passage Setting Implementation
	if (this._regionPassageData[mapId]) {
		var regionId = this.regionId(x,y,mapId);
		var passage = this._regionPassageData[mapId][regionId];
		if (passage) {
			if ((passage & bit) === bit) {
				return true;
			} else {
				return false;
			}
		}
	}
	if (Imported.Kien_EventPassableOverride) {
		var dir = (Math.log2(bit) + 1)*2;
		var dirs = this.eventsXy(x,y,mapId).map(function(event){return event.passableOverride()});
		if(dirs.length > 0){
			for (var n = 0 ; n < dirs.length ; n++ ){
				if(dirs[n].length>0){
					var d = dirs[n];
					if(d.indexOf("0") >= 0){
						return false;
					}
					if (d.indexOf(dir.toString()) >= 0){
						return true;
					}
				}
			}
		}
	}
    var flags = this.tilesetFlags(mapId);
    var tiles = this.allTiles(x, y, mapId);
    for (var i = 0; i < tiles.length; i++) {
        var flag = flags[tiles[i]];
        if ((flag & 0x10) !== 0)  // [*] No effect on passage
            continue;
        if (tiles[i] == 1544) {
        	continue;
        }
        if ((flag & bit) === 0)   // [o] Passable
            return true;
        if ((flag & bit) === bit) // [x] Impassable
            return false;
    }
    return false;
};

Game_Map.prototype.tileId = function(x, y, z, mapId) {
    var width = this.mapData(mapId).width;
    var height = this.mapData(mapId).height;
    return this.mapData(mapId).data[(z * height + y) * width + x] || 0;
};

Game_Map.prototype.layeredTiles = function(x, y, mapId) {
    var tiles = [];
    for (var i = 0; i < 4; i++) {
        tiles.push(this.tileId(x, y, 3 - i, mapId));
    }
    // var arr = this.getLowerSortedLayer(this.mapIdToLayerIndex(mapId));
    // if (arr.length > 1) {
    // 	var nmapId = this.getCurrentLayerData()[arr[arr.length - 2]];
    // 	if (nmapId){
    // 		tiles = tiles.concat(this.layeredTiles(x,y,nmapId));
    // 	}
    // }
    return tiles;
};

Game_Map.prototype.allTiles = function(x, y, mapId) {
	var arr = this.getLowerSortedLayer(this.mapIdToLayerIndex(mapId));
    var tiles = this.tileEventsXy(x, y, mapId).filter(function(event) {
    	return arr.contains($gameMap.mapIdToLayerIndex(event._mapId));
    }).map(function(event) {
        return event.tileId();
    }.bind(this));
    return tiles.concat(this.layeredTiles(x, y, mapId));
};

Game_Map.prototype.scrollDown = function(distance) {
    if (this.isLoopVertical()) {
        this._displayY += distance;
        this._displayY %= $dataMap.height;
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        if (this._parallaxLoopY[mapId]) {
	            this._parallaxY[mapId] += distance;
	        }
	    }
    } else if (this.height() >= this.screenTileY()) {
        var lastY = this._displayY;
        this._displayY = Math.min(this._displayY + distance,
            this.height() - this.screenTileY());
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
        	this._parallaxY[mapId] += this._displayY - lastY;
	    }
    }
};

Game_Map.prototype.scrollLeft = function(distance) {
    if (this.isLoopHorizontal()) {
        this._displayX += $dataMap.width - distance;
        this._displayX %= $dataMap.width;
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        if (this._parallaxLoopX[mapId]) {
	            this._parallaxX[mapId] -= distance;
	        }
	    }
    } else if (this.width() >= this.screenTileX()) {
        var lastX = this._displayX;
        this._displayX = Math.max(this._displayX - distance, 0);
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
        	this._parallaxX[mapId] += this._displayX - lastX;
	    }
    }
};

Game_Map.prototype.scrollRight = function(distance) {
    if (this.isLoopHorizontal()) {
        this._displayX += distance;
        this._displayX %= $dataMap.width;
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        if (this._parallaxLoopX[mapId]) {
	            this._parallaxX[mapId] += distance;
	        }
	    }
    } else if (this.width() >= this.screenTileX()) {
        var lastX = this._displayX;
        this._displayX = Math.min(this._displayX + distance,
            this.width() - this.screenTileX());
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
        	this._parallaxX[mapId] += this._displayX - lastX;
	    }
    }
};

Game_Map.prototype.scrollUp = function(distance) {
    if (this.isLoopVertical()) {
        this._displayY += $dataMap.height - distance;
        this._displayY %= $dataMap.height;
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
	        if (this._parallaxLoopY[mapId]) {
	            this._parallaxY[mapId] -= distance;
	        }
	    }
    } else if (this.height() >= this.screenTileY()) {
        var lastY = this._displayY;
        this._displayY = Math.max(this._displayY - distance, 0);
		var mapIds = this.getCurrentMapIds();
		for (var mi = 0; mi < mapIds.length; mi++) {
			var mapId = mapIds[mi];
        	this._parallaxY[mapId] += this._displayY - lastY;
	    }
    }
};

Game_Map.prototype.autotileType = function(x, y, z, mapId) {
    var tileId = this.tileId(x, y, z, mapId);
    return tileId >= 2048 ? Math.floor((tileId - 2048) / 48) : -1;
};

Game_Map.prototype.isPassable = function(x, y, d, mapId) {
    return this.checkPassage(x, y, (1 << (d / 2 - 1)) & 0x0f, mapId);
};

Game_Map.prototype.isBoatPassable = function(x, y, mapId) {
    return this.checkPassage(x, y, 0x0200, mapId);
};

Game_Map.prototype.isShipPassable = function(x, y, mapId) {
    return this.checkPassage(x, y, 0x0400, mapId);
};

Game_Map.prototype.isAirshipLandOk = function(x, y, mapId) {
    return this.checkPassage(x, y, 0x0800, mapId) && this.checkPassage(x, y, 0x0f, mapId);
};

Game_Map.prototype.checkLayeredTilesFlags = function(x, y, bit, mapId) {
    var flags = this.tilesetFlags(mapId);
    return this.allTiles(x, y, mapId).some(function(tileId) {
        return (flags[tileId] & bit) !== 0;
    });
};

Game_Map.prototype.isLadder = function(x, y, mapId) {
    return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x20, mapId);
};

Game_Map.prototype.isBush = function(x, y, mapId) {
    return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x40, mapId);
};

Game_Map.prototype.isCounter = function(x, y, mapId) {
    return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x80, mapId);
};

Game_Map.prototype.isDamageFloor = function(x, y, mapId) {
    return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x100, mapId);
};

Game_Map.prototype.terrainTag = function(x, y, mapId) {
    if (this.isValid(x, y)) {
        var flags = this.tilesetFlags(mapId);
        var tiles = this.layeredTiles(x, y, mapId);
        for (var i = 0; i < tiles.length; i++) {
            var tag = flags[tiles[i]] >> 12;
            if (tag > 0) {
                return tag;
            }
        }
    }
    return 0;
};

Game_Map.prototype.regionId = function(x, y, mapId) {
	var events = this.eventsXy(x,y,mapId);
	events = events.filter(function(e) {return e._regionOverride > 0})
	if (events.length > 0) {
		return events[0]._regionOverride;
	}
    return this.isValid(x, y) ? this.tileId(x, y, 5, mapId) : 0;
};

Game_Map.prototype.refresh = function() {
    this.events().forEach(function(event) {
        event.refresh();
    });
    this._commonEvents.forEach(function(event) {
        event.refresh();
    });
    this.refreshTileEvents();
    this._needsRefresh = false;
};

Game_Map.prototype.updateEvents = function() {
    this.events().forEach(function(event) {
    	if (event) {
        	event.update();
    	}
    });
    this._commonEvents.forEach(function(event) {
        event.update();
    });
};

Game_Map.prototype.setupAutorunCommonEvent = function() {
    for (var i = 0; i < $dataCommonEvents.length; i++) {
        var event = $dataCommonEvents[i];
        if (event && event.trigger === 1 && $gameSwitches.value(event.switchId)) {
            this._interpreter.setup(event.list);
            return true;
        }
    }
    return false;
};

Game_Map.prototype.updateParallax = function() {
	var mapIds = this.getCurrentMapIds();
	for (var mi = 0; mi < mapIds.length; mi++) {
		var mapId = mapIds[mi];
	    if (this._parallaxLoopX[mapId]) {
	        this._parallaxX[mapId] += this._parallaxSx[mapId] / this.tileWidth() / 2;
	    }
	    if (this._parallaxLoopY[mapId]) {
	        this._parallaxY[mapId] += this._parallaxSy[mapId] / this.tileHeight() / 2;
	    }
    }
};

Game_Map.prototype.setupStartingMapEvent = function() {
    var events = this.events();
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.isStarting()) {
            event.clearStartingFlag();
            this._interpreter.setup(event.list(), event.eventId(), event._originalMapId);
            return true;
        }
    }
    return false;
};

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

Kien.MMS.Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
	Kien.MMS.Game_CharacterBase_initMembers.apply(this, arguments);
	this._noSlip = false;
}

Game_CharacterBase.prototype.pos = function(x, y, mapId) {
	if (mapId != undefined && mapId > 0 && this._mapId != undefined && this._mapId != mapId) {
		return false;
	}
    return this._x === x && this._y === y;
};

Game_CharacterBase.prototype.posNt = function(x, y, mapId) {
    // No through
    return this.pos(x, y, mapId) && !this.isThrough();
};

Kien.MMS.Game_CharacterBase_moveStraight = Game_CharacterBase.prototype.moveStraight;
Game_CharacterBase.prototype.moveStraight = function(d) {
	Kien.MMS.Game_CharacterBase_moveStraight.apply(this, arguments);
    if (this.isMovementSucceeded()) {
    	this._lastMoveDirection = d;
    }
};

Kien.MMS.Game_CharacterBase_updateMove = Game_CharacterBase.prototype.updateMove;
Game_CharacterBase.prototype.updateMove = function() {
	Kien.MMS.Game_CharacterBase_updateMove.apply(this, arguments);
    if (!this.isMoving()) {
    	if (this._lastMoveDirection && this._lastMoveDirection > 0) {
    		if (!this._noSlip) {
		    	if (this._mapId && this.regionId(this.x, this.y, this._mapId) == $gameMap._regionSlippingSurface[this._mapId]) {
		    		this.moveStraight(this._lastMoveDirection);
		    		if (!this.isMovementSucceeded()) {
		    			this._lastMoveDirection = -1;
		    		}
		    	}
    		}
    	}
    }
};

Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
    var x2 = $gameMap.roundXWithDirection(x, d);
    var y2 = $gameMap.roundYWithDirection(y, d);
    var d2 = this.reverseDir(d);
    return $gameMap.isPassable(x, y, d, this._mapId) && $gameMap.isPassable(x2, y2, d2, this._mapId);
};

Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
    var events = $gameMap.eventsXyNt(x, y, this._mapId);
    return events.some(function(event) {
        return event.isNormalPriority();
    });
};

Game_CharacterBase.prototype.isCollidedWithVehicles = function(x, y) {
    return $gameMap.boat().posNt(x, y, this._mapId) || $gameMap.ship().posNt(x, y, this._mapId);
};

Game_CharacterBase.prototype.isOnLadder = function() {
    return $gameMap.isLadder(this._x, this._y, this._mapId);
};

Game_CharacterBase.prototype.isOnBush = function() {
    return $gameMap.isBush(this._x, this._y, this._mapId);
};

Game_CharacterBase.prototype.terrainTag = function() {
    return $gameMap.terrainTag(this._x, this._y, this._mapId);
};

Game_CharacterBase.prototype.regionId = function() {
    return $gameMap.regionId(this._x, this._y, this._mapId);
};

Game_CharacterBase.prototype.preferredLayerIndex = function() {
	if (this._targetMapId) {
		return Math.max($gameMap.mapIdToLayerIndex(this._mapId), $gameMap.mapIdToLayerIndex(this._targetMapId));
	} else {
		return $gameMap.mapIdToLayerIndex(this._mapId);
	}
}

Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
    var searchLimit = this.searchLimit();
    var mapWidth = $gameMap.width();
    var nodeList = [];
    var openList = [];
    var closedList = [];
    var start = {};
    var best = start;

    if (this.x === goalX && this.y === goalY) {
        return 0;
    }

    start.parent = null;
    start.x = this.x;
    start.y = this.y;
    start.g = 0;
    start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
    nodeList.push(start);
    openList.push(start.y * mapWidth + start.x);

    var loopCount = 0;
    while (nodeList.length > 0) {
    	loopCount++;
        var bestIndex = 0;
        for (var i = 0; i < nodeList.length; i++) {
            if (nodeList[i].f < nodeList[bestIndex].f) {
                bestIndex = i;
            }
        }

        var current = nodeList[bestIndex];
        var x1 = current.x;
        var y1 = current.y;
        var pos1 = y1 * mapWidth + x1;
        var g1 = current.g;

        nodeList.splice(bestIndex, 1);
        openList.splice(openList.indexOf(pos1), 1);
        closedList.push(pos1);

        if (current.x === goalX && current.y === goalY) {
            best = current;
            break;
        }

        if (g1 >= searchLimit) {
            continue;
        }

        for (var j = 0; j < 4; j++) {
            var direction = 2 + j * 2;
            var x2 = $gameMap.roundXWithDirection(x1, direction);
            var y2 = $gameMap.roundYWithDirection(y1, direction);
            var pos2 = y2 * mapWidth + x2;

            if (closedList.contains(pos2)) {
                continue;
            }

            if (!this.canPass(x1, y1, direction)) {
                continue;
            }

            var g2 = g1 + 1;
            var index2 = openList.indexOf(pos2);

            if (index2 < 0 || g2 < nodeList[index2].g) {
                var neighbor;
                if (index2 >= 0) {
                    neighbor = nodeList[index2];
                } else {
                    neighbor = {};
                    nodeList.push(neighbor);
                    openList.push(pos2);
                }
                neighbor.parent = current;
                neighbor.x = x2;
                neighbor.y = y2;
                neighbor.g = g2;
                neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
                if (!best || neighbor.f - neighbor.g < best.f - best.g) {
                    best = neighbor;
                }
            }
        }
    }

    var node = best;
    while (node.parent && node.parent !== start) {
        node = node.parent;
    }

    var deltaX1 = $gameMap.deltaX(node.x, start.x);
    var deltaY1 = $gameMap.deltaY(node.y, start.y);
    if (deltaY1 > 0) {
        return 2;
    } else if (deltaX1 < 0) {
        return 4;
    } else if (deltaX1 > 0) {
        return 6;
    } else if (deltaY1 < 0) {
        return 8;
    }

    var deltaX2 = this.deltaXFrom(goalX);
    var deltaY2 = this.deltaYFrom(goalY);
    if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
        return deltaX2 > 0 ? 4 : 6;
    } else if (deltaY2 !== 0) {
        return deltaY2 > 0 ? 8 : 2;
    }

    return 0;
};
//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

Kien.MMS.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function() {
    Kien.MMS.Game_Player_initMembers.apply(this, arguments);
    this._targetMapId = null;
    this._forceDash = false;
};

Kien.MMS.Game_Player_updateMove = Game_Player.prototype.updateMove;
Game_Player.prototype.updateMove = function() {
	Kien.MMS.Game_Player_updateMove.apply(this, arguments);
    if (!this.isMoving()) {
    	if (this._targetMapId != null) {
	    	this._mapId = this._targetMapId;
	        this._targetMapId = null;
    	}
    }
};

Game_Player.prototype.isCollidedWithEvents = function(x, y) {
	var mapId = this._targetMapId ? this._targetMapId : this._mapId;
    var events = $gameMap.eventsXyNt(x, y, mapId);
    return events.some(function(event) {
        return event.isNormalPriority();
    });
};

Game_Player.prototype.isCollidedWithVehicles = function(x, y) {
	var mapId = this._targetMapId ? this._targetMapId : this._mapId;
    return $gameMap.boat().posNt(x, y, mapId) || $gameMap.ship().posNt(x, y, mapId);
};

Game_Player.prototype.performTransfer = function() {
    if (this.isTransferring()) {
        this.setDirection(this._newDirection);
        if (this._newMapId !== $gameMap.mapId() || this._needsMapReload) {
        	this._mapId = this._newMapId;
        	this._followers.setMapId(this._mapId);
            $gameMap.setup(this._newMapId);
            this._needsMapReload = false;
        }
        this.locate(this._newX, this._newY);
        this.refresh();
        this.clearTransferInfo();
    }
};

Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    if (!$gameMap.isEventRunning()) {
        $gameMap.eventsXy(x, y, this._mapId).forEach(function(event) {
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
                event.start();
            }
        });
    }
};

Game_Player.prototype.updateDashing = function() {
    if (this.isMoving()) {
        return;
    }
    if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled(this._mapId)) {
        this._dashing = this.isDashButtonPressed() || $gameTemp.isDestinationValid() || this._forceDash;
    } else {
        this._dashing = false;
    }
};

Game_Player.prototype.triggerTouchActionD1 = function(x1, y1) {
    if ($gameMap.airship().pos(x1, y1, this._mapId)) {
        if (TouchInput.isTriggered() && this.getOnOffVehicle()) {
            return true;
        }
    }
    this.checkEventTriggerHere([0]);
    return $gameMap.setupStartingEvent();
};

Game_Player.prototype.triggerTouchActionD2 = function(x2, y2) {
    if ($gameMap.boat().pos(x2, y2, this._mapId) || $gameMap.ship().pos(x2, y2, this._mapId)) {
        if (TouchInput.isTriggered() && this.getOnVehicle()) {
            return true;
        }
    }
    if (this.isInBoat() || this.isInShip()) {
        if (TouchInput.isTriggered() && this.getOffVehicle()) {
            return true;
        }
    }
    this.checkEventTriggerThere([0,1,2]);
    return $gameMap.setupStartingEvent();
};

Game_Player.prototype.triggerTouchActionD3 = function(x2, y2) {
    if ($gameMap.isCounter(x2, y2, this._mapId)) {
        this.checkEventTriggerThere([0,1,2]);
    }
    return $gameMap.setupStartingEvent();
};

Game_Player.prototype.encounterProgressValue = function() {
    var value = $gameMap.isBush(this.x, this.y, this._mapId) ? 2 : 1;
    if ($gameParty.hasEncounterHalf()) {
        value *= 0.5;
    }
    if (this.isInShip()) {
        value *= 0.5;
    }
    return value;
};

Game_Player.prototype.checkEventTriggerThere = function(triggers) {
    if (this.canStartLocalEvents()) {
        var direction = this.direction();
        var x1 = this.x;
        var y1 = this.y;
        var x2 = $gameMap.roundXWithDirection(x1, direction);
        var y2 = $gameMap.roundYWithDirection(y1, direction);
        this.startMapEvent(x2, y2, triggers, true);
        if (!$gameMap.isAnyEventStarting() && $gameMap.isCounter(x2, y2, this._mapId)) {
            var x3 = $gameMap.roundXWithDirection(x2, direction);
            var y3 = $gameMap.roundYWithDirection(y2, direction);
            this.startMapEvent(x3, y3, triggers, true);
        }
    }
};

Game_Player.prototype.isOnDamageFloor = function() {
    return $gameMap.isDamageFloor(this.x, this.y, this._mapId) && !this.isInAirship();
};

Game_Player.prototype.makeEncounterCount = function() {
    var n = $gameMap.encounterStep(this._mapId);
    this._encounterCount = Math.randomInt(n) + Math.randomInt(n) + 1;
};

Game_Player.prototype.makeEncounterTroopId = function() {
    var encounterList = [];
    var weightSum = 0;
    $gameMap.encounterList(this._mapId).forEach(function(encounter) {
        if (this.meetsEncounterConditions(encounter)) {
            encounterList.push(encounter);
            weightSum += encounter.weight;
        }
    }, this);
    if (weightSum > 0) {
        var value = Math.randomInt(weightSum);
        for (var i = 0; i < encounterList.length; i++) {
            value -= encounterList[i].weight;
            if (value < 0) {
                return encounterList[i].troopId;
            }
        }
    }
    return 0;
};

Game_Player.prototype.moveStraight = function(d) {
    if (this.canPass(this.x, this.y, d)) {
        this._followers.updateMove();
    }
    Game_Character.prototype.moveStraight.call(this, d);
    if (!this.isMovementSucceeded()) {
	    var regionId = $gameMap.regionId(this.x, this.y, this._mapId);
	    if ($gameMap.isLayerMovementRegion(this._mapId, regionId, d)) {
		    if (!$gameMap.isEventRunning()) {
		    	var upperLayerIndex = $gameMap.getNextLayer($gameMap.mapIdToLayerIndex(this._mapId));
		    	if (upperLayerIndex) {
		    		this._targetMapId = $gameMap.getCurrentLayerData()[upperLayerIndex];
		    		if (this.canPass(this.x, this.y, d)) {
		        		this._followers.updateMove();
		    		}
		    		Game_Character.prototype.moveStraight.call(this, d);
		    		if (!this.isMovementSucceeded()) {
		    			this._targetMapId = null;
		    		}
		    	}
		    }
		    if (!this.isMovementSucceeded() && !$gameMap.isEventRunning()) {
		    	var lowerLayerIndex = $gameMap.getPreviousLayer($gameMap.mapIdToLayerIndex(this._mapId));
		    	console.lot()
		    	if (lowerLayerIndex) {
		    		this._targetMapId = $gameMap.getCurrentLayerData()[lowerLayerIndex];
		    		if (this.canPass(this.x, this.y, d)) {
		        		this._followers.updateMove();
		    		}
		    		Game_Character.prototype.moveStraight.call(this, d);
		    		if (!this.isMovementSucceeded()) {
		    			this._targetMapId = null;
		    		}
		    	}
		    }
	    }
    };
};

Game_Player.prototype.canPass = function(x, y, d) {
    var x2 = $gameMap.roundXWithDirection(x, d);
    var y2 = $gameMap.roundYWithDirection(y, d);
    if (!$gameMap.isValid(x2, y2)) {
        return false;
    }
    if (this.isThrough() || this.isDebugThrough()) {
        return true;
    }
    if (!this.isMapPassable(x, y, d)) {
        return false;
    }
    if (this.isCollidedWithCharacters(x2, y2)) {
        return false;
    }
    return true;
};

Game_Player.prototype.isMapPassable = function(x, y, d) {
    var vehicle = this.vehicle();
    if (vehicle) {
        return vehicle.isMapPassable(x, y, d);
    } else {
	    var x2 = $gameMap.roundXWithDirection(x, d);
	    var y2 = $gameMap.roundYWithDirection(y, d);
	    var d2 = this.reverseDir(d);
	    var mapId = this._mapId;
	    var tmapId = this._targetMapId ? this._targetMapId : this._mapId;
	    return $gameMap.isPassable(x, y, d, mapId) && $gameMap.isPassable(x2, y2, d2, tmapId);
    }
};

Game_Player.prototype.goPreviousLayer = function() {
	var layerIndex = $gameMap.getPreviousLayer($gameMap.mapIdToLayerIndex(this._mapId));
	if (layerIndex) {
		this._mapId = $gameMap.getCurrentLayerData()[layerIndex];
	}
}

Game_Player.prototype.goNextLayer = function() {
	var layerIndex = $gameMap.getNextLayer($gameMap.mapIdToLayerIndex(this._mapId));
	if (layerIndex) {
		this._mapId = $gameMap.getCurrentLayerData()[layerIndex];
	}
}

//-----------------------------------------------------------------------------
// Game_Follower
//
// The game object class for a follower. A follower is an allied character,
// other than the front character, displayed in the party.

Kien.MMS.Game_Follower_update = Game_Follower.prototype.update;
Game_Follower.prototype.update = function() {
    Kien.MMS.Game_Follower_update.apply(this, arguments);
    this._mapId = $gamePlayer._mapId;
    this._targetMapId = $gamePlayer._targetMapId;
};

Game_Follower.prototype.isOnBush = function() {
    return $gameMap.isMapIdInLayer(this._mapId) && Game_Character.prototype.isOnBush.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Game_Followers
//
// The wrapper class for a follower array.

Game_Followers.prototype.setMapId = function(mapId) {
	this.forEach(function(follower) {
		follower._mapId = mapId;
	})
};

//-----------------------------------------------------------------------------
// Game_Vehicle
//
// The game object class for a vehicle.

Game_Vehicle.prototype.refresh = function() {
    if (this._driving) {
        this._mapId = $gamePlayer._mapId;
        this.syncWithPlayer();
    } else if ($gameMap.isMapIdInLayer(this._mapId)) {
        this.locate(this.x, this.y);
    }
    if (this.isAirship()) {
        this.setPriorityType(this._driving ? 2 : 0);
    } else {
        this.setPriorityType(1);
    }
    this.setWalkAnime(this._driving);
    this.setStepAnime(this._driving);
    this.setTransparent(!$gameMap.isMapIdInLayer(this._mapId));
};

Game_Vehicle.prototype.isMapPassable = function(x, y, d) {
    var x2 = $gameMap.roundXWithDirection(x, d);
    var y2 = $gameMap.roundYWithDirection(y, d);
    if (this.isBoat()) {
        return $gameMap.isBoatPassable(x2, y2, this._mapId);
    } else if (this.isShip()) {
        return $gameMap.isShipPassable(x2, y2, this._mapId);
    } else if (this.isAirship()) {
        return true;
    } else {
        return false;
    }
};

Game_Vehicle.prototype.isLandOk = function(x, y, d) {
    if (this.isAirship()) {
        if (!$gameMap.isAirshipLandOk(x, y, this._mapId)) {
            return false;
        }
        if ($gameMap.eventsXy(x, y, this._mapId).length > 0) {
            return false;
        }
    } else {
        var x2 = $gameMap.roundXWithDirection(x, d);
        var y2 = $gameMap.roundYWithDirection(y, d);
        if (!$gameMap.isValid(x2, y2)) {
            return false;
        }
        if (!$gameMap.isPassable(x2, y2, this.reverseDir(d), this._mapId)) {
            return false;
        }
        if (this.isCollidedWithCharacters(x2, y2)) {
            return false;
        }
    }
    return true;
};

//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Kien.MMS.Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
	this._originalMapId = mapId;
	Kien.MMS.Game_Event_initialize.apply(this, arguments);
};

Kien.MMS.Game_Event_initMembers = Game_Event.prototype.initMembers;
Game_Event.prototype.initMembers = function() {
	Kien.MMS.Game_Event_initMembers.apply(this, arguments);
    this._rangeDiffSet = [];
    this._linkedEvent = [];
    this._isIgnoredByEvent = false;
};

Game_Event.prototype.isIgnoredByEvent = function() {
	return this._isIgnoredByEvent;
}

Kien.MMS.Game_Event_pos = Game_Event.prototype.pos;
Game_Event.prototype.pos = function(x, y) {
	var ret = Kien.MMS.Game_Event_pos.apply(this, arguments);
	if (!ret) {
		for (var i = 0; i < this._rangeDiffSet.length; i++) {
			var diff = this._rangeDiffSet[i];
			if (this.x+diff.x == x && this.y+diff.y == y) {
				return true;
			}
		}
	}
	return ret;
}

Kien.MMS.Game_Event_canPass = Game_Event.prototype.canPass;
Game_Event.prototype.canPass = function(x, y, d) {
	var ret = Kien.MMS.Game_Event_canPass.apply(this, arguments);
	if (ret) {
		for (var i = 0; i < this._rangeDiffSet.length; i++) {
			var diff = this._rangeDiffSet[i];
			ret = Kien.MMS.Game_Event_canPass.call(this, x+diff.x, y+diff.y, d);
			if (!ret) {
				return false;
			}
		}
	}
	return ret;
};

Kien.MMS.Game_Event_refresh = Game_Event.prototype.refresh;
Game_Event.prototype.refresh = function() {
	var oldPageIndex = this._pageIndex;
	var oldIsTile = this.isTile();
	Kien.MMS.Game_Event_refresh.apply(this, arguments);
	if (oldPageIndex != this._pageIndex && oldIsTile != this.isTile()) {
		if (!oldIsTile) {
			$gameMap.tileEvents.push(this);
		} else {
			$gameMap.tileEvents.splice($gameMap.tileEvents.indexOf(this), 1);
		}
	}
};

Game_Event.prototype.meetsConditions = function(page) {
    var c = page.conditions;
    if (c.switch1Valid) {
        if (!$gameSwitches.value(c.switch1Id)) {
            return false;
        }
    }
    if (c.switch2Valid) {
        if (!$gameSwitches.value(c.switch2Id)) {
            return false;
        }
    }
    if (c.variableValid) {
        if ($gameVariables.value(c.variableId) < c.variableValue) {
            return false;
        }
    }
    if (c.selfSwitchValid) {
        var key = [this._originalMapId, this._eventId, c.selfSwitchCh];
        if ($gameSelfSwitches.value(key) !== true) {
            return false;
        }
    }
    if (c.itemValid) {
        var item = $dataItems[c.itemId];
        if (!$gameParty.hasItem(item)) {
            return false;
        }
    }
    if (c.actorValid) {
        var actor = $gameActors.actor(c.actorId);
        if (!$gameParty.members().contains(actor)) {
            return false;
        }
    }
    return true;
};

Kien.MMS.Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function() {
	Kien.MMS.Game_Event_setupPageSettings.apply(this, arguments);
	this.refreshRange();
	this.refreshLinkedEvent();
	this.refershIgnoreByEvent();
	this.refreshRegionOverride();
};

Game_Event.prototype.refreshLinkedEvent = function() {
	this.clearLinkedEvent();
	var comments = this.firstComments();
	var reg = /<LinkEvent (\d+)(?:[ ]?,[ ]?(\d+))?>/g;
	var match = null;
	while (match = reg.exec(comments)) {
		this.addLinkedEvent(parseInt(RegExp.$1), parseInt(RegExp.$2) || null);
	}
}

Game_Event.prototype.refreshRange = function() {
	this._rangeDiffSet = [];
	var comments = this.firstComments();
	var reg = /<AddRange ([+-]?\d+),([+-]?\d+)>/g;
	var match = null;
	while (match = reg.exec(comments)) {
		this._rangeDiffSet.push({
			"x" : parseInt(RegExp.$1, 10),
			"y" : parseInt(RegExp.$2, 10)
		})
	}
}

Game_Event.prototype.refreshRegionOverride = function() {
	this._regionOverride = -1;
	var comments = this.firstComments();
	var reg = /<Region (\d+)>/i;
	var match = null;
	if (comments.match(reg)) {
		this._regionOverride = parseInt(RegExp.$1);
	}
}

Game_Event.prototype.refershIgnoreByEvent = function() {
	var comments = this.firstComments();
	if (comments.match(/<ignorebyevent>/i)) {
		this._isIgnoredByEvent = true;
	} else {
		this._isIgnoredByEvent = false;
	}
}

Kien.MMS.Game_Event_isTile = Game_Event.prototype.isTile;
Game_Event.prototype.isTile = function() {
	if (this.firstComments().match(/<AsTile>/i)) {
		return true;
	}
	return Kien.MMS.Game_Event_isTile.apply(this, arguments);
}

Game_Event.prototype.event = function() {
    return $gameMap.mapData(this._originalMapId).events[this._eventId];
};

Game_Event.prototype.isCollidedWithEvents = function(x, y) {
    var events = $gameMap.eventsXyNt(x, y, this._mapId);
    events = events.filter(function(e) {
    	return !this.isEventLinked(e) && !e.isIgnoredByEvent();
    }.bind(this));
    return events.length > 0;
};

Game_Event.prototype.updateParallel = function() {
    if (this._interpreter) {
        if (!this._interpreter.isRunning()) {
            this._interpreter.setup(this.list(), this._eventId, this._mapId);
        }
        this._interpreter.update();
    }
};

Kien.MMS.Game_Event_moveStraight = Game_Event.prototype.moveStraight;
Game_Event.prototype.moveStraight = function(d) {
	var lx = this._x;
	var ly = this._y;
	Kien.MMS.Game_Event_moveStraight.apply(this, arguments);
    if (this.isMovementSucceeded()) {
    	var dx = this._x - lx;
    	var dy = this._y - ly;
    	for (var i = 0; i < this._linkedEvent.length; i++) {
    		var obj = this._linkedEvent[i];
    		var event = $gameMap.event(obj.eventId, obj.mapId);
    		if (event) {
	    		event._x += dx;
	    		event._y += dy;
	    		event._moveSpeed = this._moveSpeed;
    		}
    	}
    }
};

Game_Event.prototype.addLinkedEvent = function(eventId, mapId) {
	mapId = mapId || this._originalMapId;
	if (this._linkedEvent.filter(function(obj) {return obj.eventId == eventId && obj.mapId == mapId}).length == 0) {
		this._linkedEvent.push({"eventId" : eventId, "mapId" : mapId});
	} 
}

Game_Event.prototype.isEventLinked = function(event) {
	return this._linkedEvent.filter(function(obj) {
		return obj.eventId == event._eventId && obj.mapId == event._mapId;
	}).length > 0;
}

Game_Event.prototype.clearLinkedEvent = function() {
	this._linkedEvent.clear();
}

Game_Event.prototype.goPreviousLayer = function() {
	var layerIndex = $gameMap.getPreviousLayer($gameMap.mapIdToLayerIndex(this._mapId));
	if (layerIndex) {
		this._mapId = $gameMap.getCurrentLayerData()[layerIndex];
	}
}

Game_Event.prototype.goNextLayer = function() {
	var layerIndex = $gameMap.getNextLayer($gameMap.mapIdToLayerIndex(this._mapId));
	if (layerIndex) {
		this._mapId = $gameMap.getCurrentLayerData()[layerIndex];
	}
}

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

Kien.MMS.Game_Interpreter_clear = Game_Interpreter.prototype.clear;
Game_Interpreter.prototype.clear = function() {
	Kien.MMS.Game_Interpreter_clear.apply(this, arguments);
	this._targetMapId = 0;
	this._targetEventId = null;
};

Kien.MMS.Game_Interpreter_setup = Game_Interpreter.prototype.setup;
Game_Interpreter.prototype.setup = function(list, eventId, mapId) {
	Kien.MMS.Game_Interpreter_setup.apply(this, arguments);
	if (mapId !== undefined || mapId !== null) {
		this._mapId = mapId;
	}
	this._targetMapId = this._mapId;
};

Game_Interpreter.prototype.isOnCurrentMap = function() {
    return $gameMap.isMapIdInLayer(this._targetMapId);
};

Game_Interpreter.prototype.character = function(param) {
    if ($gameParty.inBattle()) {
        return null;
    } else if (param < 0) {
        return $gamePlayer;
    } else if (this.isOnCurrentMap()) {
    	if (this._targetEventId) {
    		param = this._targetEventId;
    	}
        return $gameMap.event(param > 0 ? param : this._eventId, this._targetMapId);
    } else {
        return null;
    }
};

// Control Self Switch
Game_Interpreter.prototype.command123 = function() {
    if (this._eventId > 0 || this._targetEventId) {
        var key = [this._targetMapId, this._eventId, this._params[0]];
    	if (this._targetEventId) {
    		key[1] = this._targetEventId;
    	}
        $gameSelfSwitches.setValue(key, this._params[1] === 0);
    }
    return true;
};

// Erase Event
Game_Interpreter.prototype.command214 = function() {
    if (this.isOnCurrentMap() && this._eventId > 0) {
        $gameMap.eraseEvent(this._eventId, this._targetMapId);
    }
    return true;
};

// Change Tileset
Game_Interpreter.prototype.command282 = function() {
    var tileset = $dataTilesets[this._params[0]];
    if(!this._imageReservationId){
        this._imageReservationId = Utils.generateRuntimeId();
    }

    var allReady = tileset.tilesetNames.map(function(tilesetName) {
        return ImageManager.reserveTileset(tilesetName, 0, this._imageReservationId);
    }, this).every(function(bitmap) {return bitmap.isReady();});

    if (allReady) {
        $gameMap.changeTileset(this._params[0], this._targetMapId);
        ImageManager.releaseReservation(this._imageReservationId);
        this._imageReservationId = null;

        return true;
    } else {
        return false;
    }
};

// Change Battle Back
Game_Interpreter.prototype.command283 = function() {
    $gameMap.changeBattleback(this._params[0], this._params[1], this._targetMapId);
    return true;
};

// Change Parallax
Game_Interpreter.prototype.command284 = function() {
    $gameMap.changeParallax(this._params[0], this._params[1],
        this._params[2], this._params[3], this._params[4], this._targetMapId);
    return true;
};

// Get Location Info
Game_Interpreter.prototype.command285 = function() {
    var x, y, value;
    if (this._params[2] === 0) {  // Direct designation
        x = this._params[3];
        y = this._params[4];
    } else {  // Designation with variables
        x = $gameVariables.value(this._params[3]);
        y = $gameVariables.value(this._params[4]);
    }
    switch (this._params[1]) {
    case 0:     // Terrain Tag
        value = $gameMap.terrainTag(x, y, this._targetMapId);
        break;
    case 1:     // Event ID
        value = $gameMap.eventIdXy(x, y);
        break;
    case 2:     // Tile ID (Layer 1)
    case 3:     // Tile ID (Layer 2)
    case 4:     // Tile ID (Layer 3)
    case 5:     // Tile ID (Layer 4)
        value = $gameMap.tileId(x, y, this._params[1] - 2, this._targetMapId);
        break;
    default:    // Region ID
        value = $gameMap.regionId(x, y, this._targetMapId);
        break;
    }
    $gameVariables.setValue(this._params[0], value);
    return true;
};

Game_Interpreter.prototype.setupChild = function(list, eventId) {
    this._childInterpreter = new Game_Interpreter(this._depth + 1);
    this._childInterpreter.setup(list, eventId, this._mapId);
    this._childInterpreter._targetMapId = this._targetMapId;
};

Game_Interpreter.prototype.changeTargetEvent = function(ids) {
	var id;
	if (ids.match(/^(\d+)$/)) {
		id = parseInt(ids,10);
	} else {
		id = eval(ids);
	}
	this._targetEventId = id;
}

Game_Interpreter.prototype.changeTargetMap = function(ids) {
	var id;
	if (ids.match(/^(\d+)$/)) {
		id = parseInt(ids,10);
	} else {
		id = eval(ids);
	}
	this._targetMapId = id;
}

Game_Interpreter.prototype.clearTargetEvent = function() {
	this._targetEventId = null;
}

Game_Interpreter.prototype.clearTargetMap = function() {
	this._targetMapId = this._mapId;
}

Game_Interpreter.prototype.setupReservedCommonEvent = function() {
    if ($gameTemp.isCommonEventReserved()) {
        this.setup($gameTemp.reservedCommonEvent().list, 0, $gamePlayer._mapId);
        $gameTemp.clearCommonEvent();
        return true;
    } else {
        return false;
    }
};

Game_Interpreter.prototype.setPictureTargetMapId = function(param) {
	var mapId;
	if (param.match(/^(\d+)$/)) {
		mapId = parseInt(param,10);
	} else {
		mapId = eval(param);
	}
	if (!$gameParty.inBattle()) {
		$gameTemp._pictureCommandTargetMapId = parseInt(mapId);
	}
}

Game_Interpreter.prototype.clearPictureTargetMapId = function() {
	$gameTemp._pictureCommandTargetMapId = -1;
}

Game_Interpreter.prototype.setNextPictureRelateToMap = function() {
	if (!$gameParty.inBattle()) {
		$gameTemp._nextPictureRelateToMap = true;
	}
}

Game_Interpreter.prototype.clearNextPictureRelateToMap = function() {
	$gameTemp._nextPictureRelateToMap = false;
}

Kien.lib.addPluginCommand("MMS_ChangeTargetEvent", 			Game_Interpreter.prototype.changeTargetEvent);
Kien.lib.addPluginCommand("MMS_ChangeTargetMap",   			Game_Interpreter.prototype.changeTargetMap);
Kien.lib.addPluginCommand("MMS_ClearTargetEvent",  			Game_Interpreter.prototype.clearTargetEvent);
Kien.lib.addPluginCommand("MMS_ClearTargetMap",  			Game_Interpreter.prototype.clearTargetMap);
Kien.lib.addPluginCommand("MMS_ChangePictureTargetMap",   	Game_Interpreter.prototype.setPictureTargetMapId);
Kien.lib.addPluginCommand("MMS_ClearPictureTargetMap",   	Game_Interpreter.prototype.clearPictureTargetMapId);
Kien.lib.addPluginCommand("MMS_SetNextPictureRelateMap",   	Game_Interpreter.prototype.setNextPictureRelateToMap);
Kien.lib.addPluginCommand("MMS_ClearNextPictureRelateMap",  Game_Interpreter.prototype.clearNextPictureRelateToMap);

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Kien.MMS.Sprite_Character_isTile = Sprite_Character.prototype.isTile;
Sprite_Character.prototype.isTile = function() {
    return this._character.isTile() || Kien.MMS.Sprite_Character_isTile.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Sprite_Picture
//
// The sprite for displaying a picture.

Kien.MMS.Sprite_Picture_initialize = Sprite_Picture.prototype.initialize;
Sprite_Picture.prototype.initialize = function(pictureId, mapId) {
	this._mapId = mapId || -1;
	Kien.MMS.Sprite_Picture_initialize.apply(this, arguments);
};

Sprite_Picture.prototype.picture = function() {
    return $gameScreen.picture(this._pictureId, this._mapId);
};

Sprite_Picture.prototype.updatePosition = function() {
    var picture = this.picture();
    if (picture._relateToMap) {
    	this.x = Math.floor(picture.x() - $gameMap.displayX() * $gameMap.tileWidth());
    	this.y = Math.floor(picture.y() - $gameMap.displayY() * $gameMap.tileHeight());
    } else {
    	this.x = Math.floor(picture.x());
		this.y = Math.floor(picture.y());
    }
};

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

Spriteset_Map._layerContents = [
	"_baseSprite",
	"_tilemap",
	"_characterSprites",
	"_tileset",
	"_shadowSprite",
	"_destinationSprite",
	"_pictureContainer"
]

Spriteset_Map.prototype.createLowerLayer = function() {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this._layerContainers = [];
    this._mapIdToLayer = {};
	var zs = $gameMap.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var baseSprite = this._baseSprite;
		var layerSprite = new Sprite();
		this._baseSprite.addChild(layerSprite);
		this._baseSprite = layerSprite;
		this._workingMapId = DataManager._layerData[z];
	    this.createParallax();
	    this.createTilemap();
	    this.createCharacters();
	    this.createShadow();
	    this.createDestination();
	    this.createPictures(true);
	    this._layerContainers[z] = {};
	    for (var ci = 0; ci < Spriteset_Map._layerContents.length; ci++) {
	    	var name = Spriteset_Map._layerContents[ci];
	    	this._layerContainers[z][name] = this[name];
	    }
	    this._baseSprite = baseSprite;
	}
	this._workingMapId = -1;
	this.createWeather();
};

Spriteset_Map.prototype.createPictures = function(isSub) {
    var width = Graphics.boxWidth;
    var height = Graphics.boxHeight;
    var x = (Graphics.width - width) / 2;
    var y = (Graphics.height - height) / 2;
    this._pictureContainer = new Sprite();
    this._pictureContainer.setFrame(x, y, width, height);
    for (var i = 1; i <= $gameScreen.maxPictures(); i++) {
        this._pictureContainer.addChild(new Sprite_Picture(i, this._workingMapId));
    }
    if (isSub){
    	this._baseSprite.addChild(this._pictureContainer);
    } else {
    	this.addChild(this._pictureContainer);
    }
};

Spriteset_Map.prototype.createParallax = function() {
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._baseSprite.addChild(this._parallax);
};

Spriteset_Map.prototype.createTilemap = function() {
	mapId = this._workingMapId;
    if (Graphics.isWebGL()) {
        this._tilemap = new ShaderTilemap();
    } else {
        this._tilemap = new Tilemap();
    }
    this._tilemap.tileWidth = $gameMap.tileWidth();
    this._tilemap.tileHeight = $gameMap.tileHeight();
    this._tilemap.setData($gameMap.width(), $gameMap.height(), $gameMap.data(mapId));
    this._tilemap.horizontalWrap = $gameMap.isLoopHorizontal(mapId);
    this._tilemap.verticalWrap = $gameMap.isLoopVertical(mapId);
    this.loadTileset();
    this._baseSprite.addChild(this._tilemap);
};

Spriteset_Map.prototype.loadTileset = function() {
	mapId = this._workingMapId;
    this._tileset = $gameMap.tileset(mapId);
    if (this._tileset) {
        var tilesetNames = this._tileset.tilesetNames;
        for (var i = 0; i < tilesetNames.length; i++) {
            this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
        }
        var newTilesetFlags = $gameMap.tilesetFlags(mapId);
        this._tilemap.refreshTileset();
        if (!this._tilemap.flags.equals(newTilesetFlags)) {
            this._tilemap.refresh();
        }
        this._tilemap.flags = newTilesetFlags;
    }
};

Spriteset_Map.prototype.createCharacters = function() {
	mapId = this._workingMapId;
    this._characterSprites = [];
    $gameMap.eventsInMapId(mapId).forEach(function(event) {
        this._characterSprites.push(new Sprite_Character(event));
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

Spriteset_Map.prototype.createShadow = function() {
    this._shadowSprite = new Sprite();
    this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
    this._shadowSprite.anchor.x = 0.5;
    this._shadowSprite.anchor.y = 1;
    this._shadowSprite.z = 6;
    this._tilemap.addChild(this._shadowSprite);
};

Spriteset_Map.prototype.createDestination = function() {
    this._destinationSprite = new Sprite_Destination();
    this._destinationSprite.z = 9;
    this._tilemap.addChild(this._destinationSprite);
};

Spriteset_Map.prototype.createWeather = function() {
    this._weather = new Weather();
    this.addChild(this._weather);
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
	    for (var ci = 0; ci < Spriteset_Map._layerContents.length; ci++) {
	    	var name = Spriteset_Map._layerContents[ci];
	    	this._layerContainers[z][name] = this[name];
	    }
	    this._baseSprite = baseSprite;
	}
	this.updateCharacterLayerMovement();
    this.updateWeather();
};

Spriteset_Map.prototype.updateCharacterLayerMovement = function() {
	var zs = $gameMap.getCurrentLayers();
	for (var zi = 0; zi < zs.length; zi++) {
		var z = zs[zi];
		var removed = [];
		var characterSprites = this._layerContainers[z]["_characterSprites"];
		for (var i = 0; i < characterSprites.length; i++) {
			var sprite = characterSprites[i];
			var character = sprite._character;
			var mz = character.preferredLayerIndex();
			if (mz != z) {
				removed.push(sprite);
			}
		}
		this._layerContainers[z]["_characterSprites"] = characterSprites.filter(function(sprite) {
			return !removed.contains(sprite);
		})
		for (var i = 0; i < removed.length; i++) {
			var sprite = removed[i];
			var character = sprite._character;
			var tz = character.preferredLayerIndex();;
			this._layerContainers[tz]["_characterSprites"].push(sprite);
			this._layerContainers[tz]["_tilemap"].addChild(sprite);
		}
	};
}

Spriteset_Map.prototype.updateTileset = function() {
	mapId = this._workingMapId;
    if (this._tileset !== $gameMap.tileset(mapId)) {
        this.loadTileset();
    }
};

/*
 * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
 */
Spriteset_Map.prototype._canvasReAddParallax = function() {
    var index = this._baseSprite.children.indexOf(this._parallax);
    this._baseSprite.removeChild(this._parallax);
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
    this._baseSprite.addChildAt(this._parallax,index);
};

Spriteset_Map.prototype.updateParallax = function() {
	mapId = this._workingMapId;
    if (this._parallaxName !== $gameMap.parallaxName(mapId)) {
        this._parallaxName = $gameMap.parallaxName(mapId);

        if (this._parallax.bitmap && Graphics.isWebGL() != true) {
            this._canvasReAddParallax();
        } else {
            this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        }
    }
    if (this._parallax.bitmap) {
        this._parallax.origin.x = $gameMap.parallaxOx(mapId);
        this._parallax.origin.y = $gameMap.parallaxOy(mapId);
    }
};

Spriteset_Map.prototype.updateTilemap = function() {
    this._tilemap.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
    this._tilemap.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
};

Spriteset_Map.prototype.getLayerTilemap = function(layerIndex) {
	if (this._layerContainers[layerIndex]) {
		return this._layerContainers[layerIndex]._tilemap;
	}
	return null;
}

//-----------------------------------------------------------------------------
// Scene_Boot
//
// The scene class for initializing the entire game.

Kien.MMS.Scene_Boot_isReady = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function() {
	if (DataManager.isDatabaseLoaded() && !Kien.MMS.mapSetStartLoad) {
		Kien.MMS.mapSetStartLoad = true;
		Kien.MMS.generateMapSet();
	}
    return Kien.MMS.Scene_Boot_isReady.apply(this, arguments);
};

