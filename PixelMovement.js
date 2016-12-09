//=============================================================================
// Pixel Movement
// PixelMovement.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_PixelMovement = true;

var Kien = Kien || {};
Kien.PixelMovement = {};
//=============================================================================
/*:
 * @plugindesc Magic Tower System bundle. Can be on/off.
 * @author Kien
 *
 * @param Enabled Default
 * @desc Enable the system by default.
 * @default false
 *
 * @param Player Size Width
 * @desc Width of the player. 1 means 1 tile.
 * @default 0.7
 *
 * @param Player Size Height
 * @desc Height of the player. 1 means 1 tile.
 * @default 0.7
 * 
 * @param Debug Mode
 * @desc show the rects to represents collision rect.
 * @default false
 *
*/

Kien.PixelMovement.parameters = PluginManager.parameters("PixelMovement");
Kien.PixelMovement.enableDefault = eval(Kien.PixelMovement.parameters["Enabled Default"]);
Kien.PixelMovement.playerWidth = parseFloat(Kien.PixelMovement.parameters["Player Size Width"]);
Kien.PixelMovement.playerHeight = parseFloat(Kien.PixelMovement.parameters["Player Size Height"]);
Kien.PixelMovement.debugMode = eval(Kien.PixelMovement.parameters["Debug Mode"]);

if (!Imported.Kien_Lib) {
    throw new Error("No Library Found.\n Please put KienLib.js above this plugin.");
}

//-----------------------------------------------------------------------------
// Game_System
//
// The game object class for the system data.

Kien.PixelMovement.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    Kien.PixelMovement.Game_System_initialize.apply(this);
    this._pixelMoveEnabled = Kien.PixelMovement.enableDefault;
}

//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

Kien.PixelMovement.Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
	Kien.PixelMovement.Game_CharacterBase_initMembers.call(this);
	this._pixelMoveData = {};
    this._pixelMoveData._lastMove = false;
	this._pixelMoveData._characterName = this._characterName;
	this._pixelMoveData._characterIndex = this._characterIndex;
	// Boundbox from topleft of the graph.
	this._pixelMoveData._rect = new Rectangle(-0.45,-0.9,0.9,0.9);
}

Kien.PixelMovement.Game_CharacterBase_update = Game_CharacterBase.prototype.update;
Game_CharacterBase.prototype.update = function() {
    this._pixelMoveData._lastMove = false;
    Kien.PixelMovement.Game_CharacterBase_update.call(this);
    this._pixelMoveData._lastMove = false;
};

Kien.PixelMovement.Game_CharacterBase_updateMove = Game_CharacterBase.prototype.updateMove;
Game_CharacterBase.prototype.updateMove = function() {
    Kien.PixelMovement.Game_CharacterBase_updateMove.call(this);
    this._pixelMoveData._lastMove = true;
};

Kien.PixelMovement.Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function() {
    return Kien.PixelMovement.Game_CharacterBase_isMoving.call(this) || this._pixelMoveData._lastMove;
};

Game_CharacterBase.prototype.pos = function(x, y) {
    return this._pixelMoveData._rect.includePoint(x,y);
};

Game_CharacterBase.prototype.positionRect = function() {
    var r = this._pixelMoveData._rect.clone();
    r.x += this._realX;
    r.y += this._realY;
    return r;
}

Game_CharacterBase.prototype.screenX = function() {
    var tw = $gameMap.tileWidth();
    return Math.round(this.scrolledX() * tw);
};

Game_CharacterBase.prototype.screenY = function() {
    var th = $gameMap.tileHeight();
    return Math.round(this.scrolledY() * th -
                      this.shiftY() - this.jumpHeight());
};

Game_CharacterBase.prototype.canPass = function(x, y, d, dis) {
    dis = dis || this.defaultMoveAmount();
    var x2 = $gameMap.roundXWithDirection(x, d, dis);
    var y2 = $gameMap.roundYWithDirection(y, d, dis);
    if (!this.isMapValid(x2, y2)) {
        return false;
    }
    if (this.isThrough() || this.isDebugThrough()) {
        return true;
    }
    if (!this.isMapPassable(x, y, d, dis)) {
        return false;
    }
    if (this.isCollidedWithCharacters(x2, y2)) {
        return false;
    }
    return true;
};

Game_CharacterBase.prototype.defaultMoveAmount = function() {
    return $gameMap.defaultMoveAmount();
}

Game_CharacterBase.prototype.canPassDiagonally = function(x, y, horz, vert, hdis, vdis) {
    hdis = hdis || this.defaultMoveAmount();
    vdis = vdis || hdis;
    var x2 = $gameMap.roundXWithDirection(x, horz, hdis);
    var y2 = $gameMap.roundYWithDirection(y, vert, vdis);
    if (!this.isMapValid(x2, y2)) {
        return false;
    }
    var d2 = this.reverseDir(horz);
    var d3 = this.reverseDir(vert);
    var nrect = this._pixelMoveData._rect.clone();
    nrect.x += x2;
    nrect.y += y2;
    var orect = this._pixelMoveData._rect.clone();
    orect.x += x;
    orect.y += y;
    if (!(this.isMapPassableInternal(orect, horz, horz) && this.isMapPassableInternal(nrect, vert, d3)) && !(this.isMapPassableInternal(orect, vert, d3) && this.isMapPassableInternal(nrect, horz, d2))) {
        return false;
    }
    if (this.isCollidedWithCharacters(x2, y2)) {
        return false;
    }
    return true;
};

Game_CharacterBase.prototype.isCollidedWithCharacters = function(x, y) {
    return this.isCollidedWithEvents(x, y) || this.isCollidedWithVehicles(x, y);
};

Game_CharacterBase.prototype.isMapPassable = function(x, y, d, dis) {
    var x2 = $gameMap.roundXWithDirection(x, d, dis);
    var y2 = $gameMap.roundYWithDirection(y, d, dis);
    var d2 = this.reverseDir(d);
    var nrect = this._pixelMoveData._rect.clone();
    nrect.x += x2;
    nrect.y += y2;
    var orect = this._pixelMoveData._rect.clone();
    orect.x += x;
    orect.y += y;
    return this.isMapPassableInternal(orect, d, d) && this.isMapPassableInternal(nrect, d, d2);
};

Game_CharacterBase.prototype.isMapValid = function(x, y) {
    var nrect = this._pixelMoveData._rect.clone();
    nrect.x += x;
    nrect.y += y;
    return $gameMap.isValid(nrect.left, nrect.top) &&
            $gameMap.isValid(nrect.left, nrect.bottom) &&
            $gameMap.isValid(nrect.right, nrect.top) &&
            $gameMap.isValid(nrect.right, nrect.bottom);
}

Game_CharacterBase.prototype.isMapPassableInternal = function(rect, d, d2) {
    var points = rect.side(d);
    for (var pi = 0; pi < points.length; pi++) {
        var p = points[pi];
        if (!$gameMap.isPassable(p.x, p.y, d2)) {
            return false;
        }
    }
    return true;
}

Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
    var nrect = this._pixelMoveData._rect.clone();
    nrect.x += x;
    nrect.y += y;
    var events = $gameMap.events().filter(function(e) {
        return e.positionRect().overlap(nrect) && !e.isThrough();
    })
    return events.some(function(event) {
        return event.isNormalPriority();
    });
};

Game_CharacterBase.prototype.isCollidedWithVehicles = function(x, y) {
    var rect = this._pixelMoveData._rect.clone();
    rect.x += x;
    rect.y += y;

    return $gameMap.boat().positionRect().overlap(rect) || $gameMap.ship().positionRect().overlap(rect);
};

Game_CharacterBase.prototype.setPosition = function(x, y) {
    this._x = Math.round(x) + 0.5;
    this._y = Math.round(y) + this._pixelMoveData._rect.height;
    this._realX = this._x;
    this._realY = this._y;
};

Game_CharacterBase.prototype.xCoordToPosition = function(x) {
    return Math.round(x) + 0.5;
}

Game_CharacterBase.prototype.yCoordToPosition = function(y) {
    return Math.round(y) + this._pixelMoveData._rect.height;
}

Game_CharacterBase.prototype.moveStraight = function(d, dis) {
    dis = dis !== undefined ? dis : this.defaultMoveAmount();
    this.setMovementSuccess(this.canPass(this._x, this._y, d, dis));
    if (this.isMovementSucceeded()) {
        this.setDirection(d);
        this._x = $gameMap.roundXWithDirection(this._x, d, dis);
        this._y = $gameMap.roundYWithDirection(this._y, d, dis);
        this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(d), dis);
        this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(d), dis);
        this.increaseSteps();
    } else {
        this.setDirection(d);
        this.checkEventTriggerTouchFront(d, dis);
    }
};

Game_CharacterBase.prototype.moveDiagonally = function(horz, vert, hdis,vdis) {
    hdis = hdis !== undefined ? hdis : this.defaultMoveAmount();
    vdis = vdis !== undefined ? vdis : hdis;
    this.setMovementSuccess(this.canPassDiagonally(this._x, this._y, horz, vert, hdis, vdis));
    if (this.isMovementSucceeded()) {
        this._x = $gameMap.roundXWithDirection(this._x, horz, hdis);
        this._y = $gameMap.roundYWithDirection(this._y, vert, vdis);
        this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(horz), hdis);
        this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(vert), vdis);
        this.increaseSteps();
    } else {
        this.moveStraight(horz, hdis);
        if (!this.isMovementSucceeded()) {
            this.moveStraight(vert, vdis);
            if (this.isMovementSucceeded()){
                return;
            }
        }
    }
    if (this._direction === this.reverseDir(horz)) {
        this.setDirection(horz);
    }
    if (this._direction === this.reverseDir(vert)) {
        this.setDirection(vert);
    }
};

Game_CharacterBase.prototype.checkEventTriggerTouchFront = function(d,dis) {
    var x2 = $gameMap.roundXWithDirection(this._x, d, dis);
    var y2 = $gameMap.roundYWithDirection(this._y, d, dis);
    this.checkEventTriggerTouch(x2, y2);
};

//-----------------------------------------------------------------------------
// Game_Character
//
// The superclass of Game_Player, Game_Follower, GameVehicle, and Game_Event.
// Although no edits on this class, leave this header for later use :)

/*
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
    start.x = Math.floor(this.x);
    start.y = Math.floor(this.y);
    start.g = 0;
    start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
    nodeList.push(start);
    openList.push(start.y * mapWidth + start.x);

    while (nodeList.length > 0) {
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
            goaled = true;
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
*/
//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

Kien.PixelMovement.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function() {
    Kien.PixelMovement.Game_Player_initMembers.call(this);
    this._pixelMoveData._rect.width = Kien.PixelMovement.playerWidth;
    this._pixelMoveData._rect.height = Kien.PixelMovement.playerHeight;
    this._pixelMoveData._rect.x = -this._pixelMoveData._rect.width/2;
    this._pixelMoveData._rect.y = -this._pixelMoveData._rect.height;
    this._distanceCount = 0;
}

Game_Player.prototype.moveStraight = function(d, dis) {
    if (this.canPass(this.x, this.y, d, dis)) {
        this._followers.updateMove();
        this._distanceCount++;
    }
    Game_Character.prototype.moveStraight.call(this, d, dis);
};

Game_Player.prototype.moveDiagonally = function(horz, vert, hdis, vdis) {
    if (this.canPassDiagonally(this.x, this.y, horz, vert, hdis, vdis)) {
        this._followers.updateMove();
        this._distanceCount++;
    }
    Game_Character.prototype.moveDiagonally.call(this, horz, vert, hdis, vdis);
};

Game_Player.prototype.isMapPassable = function(x, y, d, dis) {
    var vehicle = this.vehicle();
    if (vehicle) {
        return vehicle.isMapPassable(x, y, d, dis);
    } else {
        return Game_Character.prototype.isMapPassable.call(this, x, y, d, dis);
    }
};

Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    if (!$gameMap.isEventRunning()) {
        var rect = this._pixelMoveData._rect.clone();
        rect.x += x;
        rect.y += y;
        $gameMap.events().filter(function(e) {
            return e.positionRect().overlap(rect);
        }).forEach(function(event) {
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
                event.start();
            }
        });
    }
};

Game_Player.prototype.getInputDirection = function() {
    return $gameSystem._pixelMoveEnabled ? Input.dir8 : Input.dir4; 
};

Game_Player.prototype.distancePerMove = function() {
    if ($gameSystem._pixelMoveEnabled) {
        var dis = this.distancePerFrame();
        dis = Math.min(dis * Math.pow(this._distanceCount + 1, 2) / 100, dis);
        return dis;
    } else {
        return 1;
    }
}

Game_Player.prototype.executeMove = function(direction) {
    switch (direction) {
        case 2:
        case 4:
        case 6:
        case 8:
            this.moveStraight(direction, this.distancePerMove());
            break;
        case 1:
        case 3:
        case 7:
        case 9:
            var vert = direction > 5 ? 8 : 2;
            var horz = (direction % 3  == 0 ) ? 6 : 4;
            this.moveDiagonally(horz, vert, this.distancePerMove());
            break;
    }
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
            if ($gameSystem._pixelMoveEnabled) {
                var vec = Kien.Vector2D.getDisplacementVector(this.x,this.y,x,y);
                vec.setMagnitude(Math.min(vec.magnitude, dis));
                this.moveDiagonally(vec.x > 0 ? 6 : (vec.x < 0 ? 4 : 0),vec.y > 0 ? 2 : (vec.y < 0 ? 8 : 0), Math.abs(vec.x), Math.abs(vec.y));
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

Kien.PixelMovement.Game_Player_updateStop = Game_Player.prototype.updateStop;
Game_Player.prototype.updateStop = function() {
    Kien.PixelMovement.Game_Player_updateStop.call(this);
    this._distanceCount = 0;
};
//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Game_Event.prototype.initialize = function(mapId, eventId) {
    Game_Character.prototype.initialize.call(this);
    this._mapId = mapId;
    this._eventId = eventId;
    var offset = this.event().meta["offset"];
    var offx = 0;
    var offy = 0;
    if (offset) {
        offset = offset.split(",");
        offx = parseFloat(offset[0]);
        offy = parseFloat(offset[1]);
    }
    this.locate(this.event().x+offx, this.event().y+offy);
    this.refresh();
};

Game_Event.prototype.checkEventTriggerTouch = function(x, y) {
    if (!$gameMap.isEventRunning()) {
        var rect = this._pixelMoveData._rect.clone();
        rect.x += x;
        rect.y += y;
        if (this._trigger === 2 && $gamePlayer.positionRect().overlap(rect)) {
            if (!this.isJumping() && this.isNormalPriority()) {
                this.start();
            }
        }
    }
};

//-----------------------------------------------------------------------------
// Game_Map
//
// The game object class for a map. It contains scrolling and passage
// determination functions.

Game_Map.prototype.canvasToMapX = function(x) {
    var tileWidth = this.tileWidth();
    var originX = this._displayX * tileWidth;
    var mapX = (originX + x) / tileWidth;
    return mapX;
};

Game_Map.prototype.canvasToMapY = function(y) {
    var tileHeight = this.tileHeight();
    var originY = this._displayY * tileHeight;
    var mapY = (originY + y) / tileHeight;
    return mapY;
};

Game_Map.prototype.defaultMoveAmount = function() {
    return 1;
}

Game_Map.prototype.roundXWithDirection = function(x, d, dis) {
	dis = dis || this.defaultMoveAmount();
    return this.roundX(x + (d === 6 ? dis : d === 4 ? -dis : 0));
};

Game_Map.prototype.roundYWithDirection = function(y, d, dis) {
	dis = dis || this.defaultMoveAmount();
    return this.roundY(y + (d === 2 ? dis : d === 8 ? -dis : 0));
};

Game_Map.prototype.xWithDirection = function(x, d, dis) {
    dis = dis || this.defaultMoveAmount();
    return x + (d === 6 ? dis : d === 4 ? -dis : 0);
};

Game_Map.prototype.yWithDirection = function(y, d, dis) {
    dis = dis || this.defaultMoveAmount();
    return y + (d === 2 ? dis : d === 8 ? -dis : 0);
};

Kien.PixelMovement.Game_Map_eventsXy = Game_Map.prototype.eventsXy;
Game_Map.prototype.eventsXy = function(x, y) {
    return Kien.PixelMovement.Game_Map_eventsXy.call(this, Math.floor(x), Math.floor(y));
};

Kien.PixelMovement.Game_Map_eventsXyNt = Game_Map.prototype.eventsXyNt;
Game_Map.prototype.eventsXyNt = function(x, y) {
    return Kien.PixelMovement.Game_Map_eventsXyNt.call(this, Math.floor(x), Math.floor(y));
};

Kien.PixelMovement.Game_Map_layeredTiles = Game_Map.prototype.layeredTiles;
Game_Map.prototype.layeredTiles = function(x, y) {
    return Kien.PixelMovement.Game_Map_layeredTiles.call(this, Math.floor(x), Math.floor(y));
};

Kien.PixelMovement.Game_Map_tileId = Game_Map.prototype.tileId;
Game_Map.prototype.tileId = function(x, y, z) {
    return Kien.PixelMovement.Game_Map_tileId.call(this, Math.floor(x), Math.floor(y), Math.floor(z));
};

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Kien.PixelMovement.Sprite_Character_updateOther = Sprite_Character.prototype.updateOther;
Sprite_Character.prototype.updateOther = function() {
    Kien.PixelMovement.Sprite_Character_updateOther.call(this);
    if (Kien.PixelMovement.debugMode){
        var rect = this._character.positionRect();
        var tw = $gameMap.tileWidth();
        var th = $gameMap.tileHeight();
        rect.x = $gameMap.adjustX(rect.x) * tw;
        rect.y = $gameMap.adjustY(rect.y) * th;
        rect.width = rect.width * tw;
        rect.height = rect.height * th;
        if (!!!this._debugSprite) {
            this._debugSprite = new Sprite();
            this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
            this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,255,255,0.5)");
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
            this.parent.addChild(this._debugSprite);
        } else {
            if (this._debugSprite.bitmap.width != rect.width || this._debugSprite.bitmap.height != rect.height) {
                this._debugSprite.bitmap.resize(rect.width, rect.height);
                this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,255,255,0.5)");
            }
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
        }
    }
};
