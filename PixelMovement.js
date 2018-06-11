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
 * @plugindesc To let characters feel more freedom. Can be on/off.
 * @author Kien
 *
 * @param Enabled Default
 * @desc Enable the system by default.
 * @default false
 *
 * @param Player Size Width
 * @desc Width of the player. 1 means 1 tile.
 * @default 0.5
 *
 * @param Player Size Height
 * @desc Height of the player. 1 means 1 tile.
 * @default 0.5
 * 
 * @param Event Trigger Length
 * @desc Length that allow player to trigger the event. 1 means 1 tile.
 * @default 0.4
 * 
 * @param Coordinate Float Precision
 * @desc Amount of digits to keep in Coordinate. Too small value will cause
 * coordinate system feels less pixelly, while large will cause glitch.
 * @default 10
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
Kien.PixelMovement.eventTriggerLength = parseFloat(Kien.PixelMovement.parameters["Event Trigger Length"]);
Kien.PixelMovement.coordinateFloatPrecision = parseFloat(Kien.PixelMovement.parameters["Coordinate Float Precision"]);
Kien.PixelMovement.debugMode = eval(Kien.PixelMovement.parameters["Debug Mode"]);

if (!Imported.Kien_Lib) {
    throw new Error("Library Plugin Not Found.\n Please put KienLib.js above this plugin.");
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
	Kien.PixelMovement.Game_CharacterBase_initMembers.apply(this, arguments);
	this._pixelMoveData = {};
    this._pixelMoveData._isMoving = false;
    this._pixelMoveData._wasMove = false;
    this._pixelMoveData._lastMoveAmount = new Kien.Vector2D(0, 0);
	this._pixelMoveData._characterName = this._characterName;
	this._pixelMoveData._characterIndex = this._characterIndex;
	// Boundbox from topleft of the graph.
	this._pixelMoveData._rect = new Kien.MovingRectangle(-0.45,-0.9,0.8,0.8);
}

Kien.PixelMovement.Game_CharacterBase_update = Game_CharacterBase.prototype.update;
Game_CharacterBase.prototype.update = function() {
    this._pixelMoveData._isMoving = false;
    this._pixelMoveData._wasMove = false;
    Kien.PixelMovement.Game_CharacterBase_update.apply(this, arguments);
    this._pixelMoveData._isMoving = false;
};

Kien.PixelMovement.Game_CharacterBase_updateMove = Game_CharacterBase.prototype.updateMove;
Game_CharacterBase.prototype.updateMove = function() {
    Kien.PixelMovement.Game_CharacterBase_updateMove.apply(this, arguments);
    this.tryLeaveCollision();
    this._pixelMoveData._isMoving = true;
    this._pixelMoveData._wasMove = true;
};

Game_CharacterBase.prototype.tryLeaveCollision = function() {
    // var events = $gameMap.events();
    // var rect = this.positionRect();
    // var oldrect = this.positionRect();
    // for (var i = 0; i < events.length; i++) {
    //     if (events[i].isNormalPriority() && !events[i].isThrough()) {
    //         var ret = rect.checkSATCollide(events[i].positionRect());
    //         if (ret.collide) {
    //             var vec = ret.axis.applyMagnitude(ret.overlap);
    //             rect.translate(vec);
    //         }
    //     }
    // }
    // var enlarge = this.positionRect();
    // enlarge.enlarge(rect);
    // var boundary = $gameMap.obtainTerrainBoundbox(enlarge);
    // var vec = boundary.getMTV(rect);
    // vec.translate(rect.x - oldrect.x, rect.y - oldrect.y);
    // if (vec.magnitude != 0) {
    //     this._x += vec.x;
    //     this._y += vec.y;
    //     this._realX += vec.x;
    //     this._realY += vec.y;
    // }
}

Kien.PixelMovement.Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function() {
    return Kien.PixelMovement.Game_CharacterBase_isMoving.apply(this, arguments);
};

Game_CharacterBase.prototype.pos = function(x, y) {
    return this.positionRect().contains(x,y);
};

Game_CharacterBase.prototype.positionRect = function(tx, ty) {
    if (!tx) {
        tx = this._realX;
    }
    if (!ty) {
        ty = this._realY;
    }
    var r = Kien.MovingRectangle.fromRectangle(this._pixelMoveData._rect);
    r.x += tx;
    r.y += ty;
    return r;
}

Game_CharacterBase.prototype.overlap = function(rect) {
    var rects = [rect];
    var trect = this.positionRect();
    if ($gameMap.isLoopHorizontal()) {
        rects.push(rect.clone().translate($gameMap.width(), 0));
    }
    if ($gameMap.isLoopVertical()) {
        rects.push(rect.clone().translate(0, $gameMap.height()));
    }
    if ($gameMap.isLoopHorizontal() && $gameMap.isLoopVertical()) {
        rects.push(rect.clone().translate($gameMap.width(), $gameMap.height()));
    }
    for (var i = 0; i < rects.length; i++) {
        if (trect.overlap(rects[i])) {
            return true;
        }
    }
    return false;
}

Game_CharacterBase.prototype.getMaxNonCollideVector = function(rect) {
    var trect = this.positionRect();
    var rects = [trect];
    var vec = rect.vector
    if ($gameMap.isLoopHorizontal()) {
        rects.push(trect.clone().translate($gameMap.width(), 0));
    }
    if ($gameMap.isLoopVertical()) {
        rects.push(trect.clone().translate(0, $gameMap.height()));
    }
    if ($gameMap.isLoopHorizontal() && $gameMap.isLoopVertical()) {
        rects.push(trect.clone().translate($gameMap.width(), $gameMap.height()));
    }
    for (var i = 0; i < rects.length; i++) {
        var temp = rect.getMaxNonCollideVector(rects[i]);
        if (temp.magnitude < vec.magnitude) {
            vec = temp;
        }
    }
    return vec;
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
    if ([2,4,6,8].indexOf(d) == -1) {
        return false;
    }
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
    return $gameSystem._pixelMoveEnabled ? this.distancePerFrame() : $gameMap.defaultMoveAmount();
}

Game_CharacterBase.prototype.canPassDiagonally = function(x, y, horz, vert, hdis, vdis) {
    return this.getMaxPassableVector(x,y,horz,vert,hdis,vdis).magnitude === 0;
};

// Return maximum available vector that can move successfully in provided direction.
Game_CharacterBase.prototype.getMaxPassableVector = function(x, y, horz, vert, hdis, vdis) {
    var vec = Kien.Vector2D.getVectorFrom2Direction(horz, vert);
    vec.x *= hdis;
    vec.y *= vdis;
    var box = new Kien.MovingRectangle();
    box.copy(this.positionRect());
    if (!$gameMap.isLoopHorizontal()) {
        vec.x = vec.x > 0 ? Math.min(vec.x, $gameMap.width() - box.x - box.width) : -Math.min(Math.abs(vec.x), box.x);
    }
    if (!$gameMap.isLoopVertical()) {
        vec.y = vec.y > 0 ? Math.min(vec.y, $gameMap.height() - box.y - box.height) : -Math.min(Math.abs(vec.y), box.y);
    }
    if (this.isThrough() || this.isDebugThrough()) {
        return vec;
    } else {
        var tbox = box.clone();
        tbox.x += vec.x;
        tbox.y += vec.y;
        tbox.vector = new Kien.Vector2D(0,0);
        tbox.enlarge(box);
        box.vector = vec;
        var boundary = $gameMap.obtainTerrainBoundbox(tbox);
        box.vector = boundary.getMaxNonCollideVector(box);
        box.vector = this.getMaxNonCollideVectorWithCharacters(box);
        return box.vector;
    }
};

Game_CharacterBase.prototype.isCollidedWithCharacters = function(x,y) {
    var boundbox;
    if (!!y) {
        boundbox = this._pixelMoveData._rect.clone();
        boundbox.x += x;
        boundbox.y += y;
    } else {
        boundbox = x;
    }
    return this.isCollidedWithEvents(boundbox) || this.isCollidedWithVehicles(boundbox);
};

Game_CharacterBase.prototype.getMaxNonCollideVectorWithCharacters = function(boundbox) {
    var vec1 = this.getMaxNonCollideVectorWithEvents(boundbox.clone())
    var vec2 = this.getMaxNonCollideVectorWithVehicles(boundbox.clone());
    return vec1.magnitude > vec2.magnitude ? vec2 : vec1;
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

Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
    var boundbox;
    if (!!y) {
        boundbox = this._pixelMoveData._rect.clone();
        boundbox.x += x;
        boundbox.y += y;
    } else {
        boundbox = x;
    }
    return $gameMap.events().some(function(event) {return event.isNormalPriority() && event.overlap(boundbox);});
};

Game_CharacterBase.prototype.isCollidedWithVehicles = function(x, y) {
    var boundbox;
    if (!!y) {
        boundbox = this._pixelMoveData._rect.clone();
        boundbox.x += x;
        boundbox.y += y;
    } else {
        boundbox = x;
    }
    return (boundbox.overlap($gameMap.boat().positionRect()) && !$gameMap.boat().isThrough())
        || (boundbox.overlap($gameMap.ship().positionRect()) && !$gameMap.ship().isThrough());
};

Game_CharacterBase.prototype.getMaxNonCollideVectorWithEvents = function(boundbox) {
    var events = $gameMap.events();
    var vec = boundbox.vector.clone();
    for (var i = 0; i < events.length; i++) {
        if (events[i].isNormalPriority() && !events[i].isThrough()) {
            var temp = events[i].getMaxNonCollideVector(boundbox);
            if (temp.magnitude < vec.magnitude) {
                vec = temp;
            }
        }
    }
    return vec;
};

Game_CharacterBase.prototype.getMaxNonCollideVectorWithVehicles = function(boundbox) {
    var vec1 = boundbox.getMaxNonCollideVector($gameMap.boat().positionRect());
    var vec2 = boundbox.getMaxNonCollideVector($gameMap.ship().positionRect());
    return vec1.magnitude > vec2.magnitude ? vec2 : vec1;
};

Game_CharacterBase.prototype.setPosition = function(x, y) {
    this._x = Math.round(x) + 0.5;
    this._y = Math.round(y) + ($gameSystem._pixelMoveEnabled ? this._pixelMoveData._rect.height : 0.9);
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
    var vec = Kien.Vector2D.getVectorFromDirection(d);
    this.moveDiagonally(d == 4 ? 4 : d == 6 ? 6 : 0, d == 2 ? 2 : d == 8 ? 8 : 0, Math.abs(vec.x * dis), Math.abs(vec.y * dis));
};

Game_CharacterBase.prototype.moveDiagonally = function(horz, vert, hdis,vdis) {
    hdis = hdis !== undefined ? hdis : this.defaultMoveAmount();
    vdis = vdis !== undefined ? vdis : hdis;
    var oldVec = Kien.Vector2D.getVectorFrom2Direction(horz, vert);
    oldVec.x *= hdis;
    oldVec.y *= vdis;
    var vec = this.getMaxPassableVector(this.x, this.y, horz, vert, hdis, vdis);
    if ($gameSystem._pixelMoveEnabled) {
        if (vec.magnitude === 0 && horz != 0) {
            vec = this.getMaxPassableVector(this.x, this.y, horz,0, oldVec.magnitude, 0);
        } 
        if (vec.magnitude === 0 && vert != 0) {
            vec = this.getMaxPassableVector(this.x, this.y, 0, vert, 0, oldVec.magnitude);
        }
    } else if (oldVec.magnitude != vec.magnitude) {
        vec = new Kien.Vector2D(0,0);
    }
    if (vec.magnitude != 0) {
        this.setMovementSuccess(true);
        this._x = $gameMap.roundX(this._x + vec.x);
        this._y = $gameMap.roundY(this._y + vec.y);
        this._realX = (this._x - vec.x);
        this._realY = (this._y - vec.y);
        this.setDirection(vec.getMainDirection());
        this._pixelMoveData._lastMoveAmount.x = vec.x;
        this._pixelMoveData._lastMoveAmount.y = vec.y; 
    } else {
        this.setMovementSuccess(false);
        this.setDirection(horz == 0 ? vert == 0 ? this.direction() : vert : horz);
        this._pixelMoveData._lastMoveAmount.set(0,0);
    }
    if (vec.magnitude != oldVec.magnitude) {
        this.checkEventTriggerTouchFront(this.direction());
    }

};

Game_CharacterBase.prototype.checkEventTriggerTouchFront = function(d, dis) {
    var x2 = $gameMap.roundXWithDirection(this._x, d, dis);
    var y2 = $gameMap.roundYWithDirection(this._y, d, dis);
    this.checkEventTriggerTouch(x2, y2);
};

//-----------------------------------------------------------------------------
// Game_Character
//
// The superclass of Game_Player, Game_Follower, GameVehicle, and Game_Event.
// Although no edits on this class, leave this header for later use :)

Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
    var searchLimit = this.searchLimit();
    var mapWidth = $gameMap.width();
    var nodeList = [];
    var openList = [];
    var closedList = [];
    var start = {};
    var best = start;

    if (Math.floor(this.x) === goalX && Math.floor(this.y) === goalY) {
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

//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

Kien.PixelMovement.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function() {
    Kien.PixelMovement.Game_Player_initMembers.apply(this, arguments);
    this._pixelMoveData._rect.width = Kien.PixelMovement.playerWidth;
    this._pixelMoveData._rect.height = Kien.PixelMovement.playerHeight;
    this._pixelMoveData._rect.x = -this._pixelMoveData._rect.width/2;
    this._pixelMoveData._rect.y = -this._pixelMoveData._rect.height;
    this._pixelMoveData._isMoveInputed = false;
    this._pixelMoveData._distanceCount = 0;
    this._pixelMoveData._movedDistance = 0;
    this._pixelMoveData._lastMovedDistance = 0;
    this._pixelMoveData._triggeredEvents = [];
    this._followerMovements = [];
}

Kien.PixelMovement.Game_Player_isMoving = Game_Player.prototype.isMoving;
Game_Player.prototype.isMoving = function() {
    return Game_Character.prototype.isMoving.call(this);
}

Game_Player.prototype.moveStraight = function(d, dis) {
    Game_Character.prototype.moveStraight.call(this, d, dis);
};

Game_Player.prototype.moveDiagonally = function(horz, vert, hdis, vdis) {
    var length = this._followerMovements.length;
    Game_Character.prototype.moveDiagonally.call(this, horz, vert, hdis, vdis);
    if (this.isMovementSucceeded() && length === this._followerMovements.length) {
        var vec2 = this._pixelMoveData._lastMoveAmount;
        this._followers.updateMove();
        this._pixelMoveData._distanceCount++;
        this._followerMovements.push([horz,vert,Math.abs(vec2.x),Math.abs(vec2.y)]);
        this._pixelMoveData._movedDistance += Math.sqrt(hdis * hdis + vdis * vdis);
    }
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
        var triggered = this._pixelMoveData._triggeredEvents;
        rect.x += x;
        rect.y += y;
        $gameMap.events().filter(function(e) {
            return e.positionRect().overlap(rect) && !triggered.contains(e);
        }).forEach(function(event) {
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
                event.start();
                if (event.event().meta["Once"]) {
                    triggered.push(event);
                }
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
        dis = Math.min(dis * Math.pow(this._pixelMoveData._distanceCount + 1, 2) / 100, dis);
        return dis;
    } else {
        return 1;
    }
}

Game_Player.prototype.executeMove = function(direction) {
    switch (direction) {
        case 2:
        case 8:
        case 4:
        case 6:
            this.moveStraight(direction,this.distancePerMove());
            break;
        case 1:
        case 3:
        case 7:
        case 9:
            var vert = direction > 5 ? 8 : 2;
            var horz = (direction % 3  == 0 ) ? 6 : 4;
            var coe = Math.sqrt(2);
            this.moveDiagonally(horz, vert, this.distancePerMove() / coe, this.distancePerMove() / coe);
            break;
    }
};

Game_Player.prototype.moveByInput = function() {
    if ((!this.isMoving()) && this.canMove()) {
        var direction = this.getInputDirection();
        if (direction > 0) {
            $gameTemp.clearDestination();
        } else if ($gameTemp.isDestinationValid()){
            var dis = this.distancePerFrame();
            var x = $gameMap.mapToCanvasX($gameTemp.destinationX());
            var y = $gameMap.mapToCanvasY($gameTemp.destinationY());
            if ($gameSystem._pixelMoveEnabled) {
                if (this.triggerAction()) {
                    return;
                }
                var prect = this.positionRect();
                var px = $gameMap.mapToCanvasX(prect.cx);
                var py = $gameMap.mapToCanvasY(prect.cy);
                var vec = Kien.Vector2D.getDisplacementVector(px,py,x,y).applyMagnitude(1/$gameMap.tileHeight());
                vec.setMagnitude(Math.min(vec.magnitude, dis));
                if (vec.magnitude < 0.00001) {
                    return;
                }
                this._pixelMoveData._isMoveInputed = true;
                this.moveDiagonally(vec.x > 0 ? 6 : (vec.x < 0 ? 4 : 0),vec.y > 0 ? 2 : (vec.y < 0 ? 8 : 0), Math.abs(vec.x), Math.abs(vec.y));
                this.setDirection(vec.getMainDirection());
                return;
            } else {
                direction = this.findDirectionTo(Math.floor(x), Math.floor(y));
            }
        }
        if (direction > 0) {
            this._pixelMoveData._isMoveInputed = true;
            this.executeMove(direction);
        }
    }
};

// Change to use rect's center for universal feeling.
// Also, that's making more sense.
Game_Player.prototype.triggerTouchAction = function() {
    if ($gameTemp.isDestinationValid()){
        var direction = this.direction();
        var el = Kien.PixelMovement.eventTriggerLength;
        var rect1 = this.positionRect();
        var rect2 = rect1.clone();
        rect2.x = $gameMap.roundXWithDirection(rect2.x, direction, el);
        rect2.y = $gameMap.roundYWithDirection(rect2.y, direction, el);
        var rect3 = rect2.clone();
        rect3.x = $gameMap.roundXWithDirection(rect3.x, direction);
        rect3.y = $gameMap.roundYWithDirection(rect3.y, direction);
        rect3.enlarge(rect2);
        var destX = ($gameTemp.destinationX());
        var destY = ($gameTemp.destinationY());
        if (rect1.contains(destX,destY)) {
            return this.triggerTouchActionD1(rect1);
        // This is ok because the most part of rect2 representing character itself
        // will cause above condition becomes true.
        } else if (rect2.contains(destX,destY)) { 
            return this.triggerTouchActionD2(rect2);
        // Same reason as above.
        } else if (rect3.contains(destX,destY)) {
            return this.triggerTouchActionD3(rect2);
        }
    }
    return false;
};

Game_Player.prototype.triggerTouchActionD1 = function(rect) {
    if ($gameMap.airship().overlap(rect)) {
        if (TouchInput.isTriggered() && this.getOnOffVehicle()) {
            return true;
        }
    }
    this.checkEventTriggerHere([0]);
    return $gameMap.setupStartingEvent();
};

Game_Player.prototype.triggerTouchActionD2 = function(rect) {
    if ($gameMap.boat().overlap(rect) || $gameMap.ship().overlap(rect)) {
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

Game_Player.prototype.triggerTouchActionD3 = function(rect) {
    var sides = rect.side(this.direction());
    var cp = Kien.lib.getMidPoint(sides[0],sides[1]);
    if ($gameMap.isCounter(cp.x, cp.y)) {
        this.checkEventTriggerThere([0,1,2]);
    }
    return $gameMap.setupStartingEvent();
};

Game_Player.prototype.checkEventTriggerThere = function(triggers) {
    if (this.canStartLocalEvents()) {
        var direction = this.direction();
        var el = Kien.PixelMovement.eventTriggerLength;
        var x1 = this.x;
        var y1 = this.y;
        var x2 = $gameMap.roundXWithDirection(x1, direction, el);
        var y2 = $gameMap.roundYWithDirection(y1, direction, el);
        this.startMapEvent(x2, y2, triggers, true);
        if (!$gameMap.isAnyEventStarting()) {
            var sides = this.positionRect(x2,y2).side(direction);
            var cp = Kien.lib.getMidPoint(sides[0],sides[1]);
            if ($gameMap.isCounter(cp.x, cp.y)) {
                var x3 = $gameMap.roundXWithDirection(x2, direction);
                var y3 = $gameMap.roundYWithDirection(y2, direction);
                this.startMapEvent(x3, y3, triggers, true);
            }
        }
    }
};

Kien.PixelMovement.Game_Player_updateStop = Game_Player.prototype.updateStop;
Game_Player.prototype.updateStop = function() {
    Kien.PixelMovement.Game_Player_updateStop.apply(this, arguments);
    this._pixelMoveData._distanceCount = 0;
};

Game_Player.prototype.update = function(sceneActive) {
    var lastScrolledX = this.scrolledX();
    var lastScrolledY = this.scrolledY();
    var wasMoving = this.isMoving();
    this.updateDashing();
    if (sceneActive) {
        this.moveByInput();
    }
    Game_Character.prototype.update.call(this);
    this.updateScroll(lastScrolledX, lastScrolledY);
    this.updateVehicle();
    if (!this.isMoving()) {
        this.updateNonmoving(wasMoving);
    }
    this._followers.update();
};

Game_Player.prototype.updateNonmoving = function(wasMoving) {
    if (!$gameMap.isEventRunning()) {
        if (wasMoving || this._pixelMoveData._wasMove) {
            if (this._pixelMoveData._movedDistance - this._pixelMoveData._lastMovedDistance >= 1) {
                this._pixelMoveData._lastMovedDistance += 1;
                $gameParty.onPlayerWalk();
                this.updateEncounterCount();
            }
            this.checkOnceEvent();
            this.checkEventTriggerHere([1,2]);
            if ($gameMap.setupStartingEvent()) {
                return;
            }
        }
        if (!$gameSystem._pixelMoveEnabled && this.triggerAction()) {
            return;
        }
        $gameTemp.clearDestination();
    }
};

Game_Player.prototype.checkOnceEvent = function() {
    var rect = this.positionRect();
    this._pixelMoveData._triggeredEvents = this._pixelMoveData._triggeredEvents.filter(function(e) { return e.overlap(rect);});
}

Kien.PixelMovement.Game_Player_locate = Game_Player.prototype.locate;
Game_Player.prototype.locate = function(x, y) {
    Kien.PixelMovement.Game_Player_locate.apply(this, arguments);
    this._pixelMoveData._movedDistance = 0;
    this._pixelMoveData._lastMovedDistance = 0;
    this._pixelMoveData._distanceCount = 0;
};


//-----------------------------------------------------------------------------
// Game_Follower
//
// The game object class for a follower. A follower is an allied character,
// other than the front character, displayed in the party.

Kien.PixelMovement.Game_Follower_initialize = Game_Follower.prototype.initialize;
Game_Follower.prototype.initialize = function(memberIndex) {
    Kien.PixelMovement.Game_Follower_initialize.apply(this, arguments);
    this._followerMovements = [];
    this._pixelMoveData._movedDistance = 0;
};

Game_Follower.prototype.precedingCharacter = function() {
    if (this._memberIndex > 0) {
        return $gamePlayer.followers().follower(this._memberIndex-1);
    } else {
        return $gamePlayer;
    }
}

Game_Follower.prototype.chaseCharacter = function(character) {
    if (character._pixelMoveData._movedDistance < 1) {
        return;
    }
    var data = character._followerMovements.shift();
    if (data) {
        this.moveDiagonally(data[0], data[1], data[2], data[3]);
    }
    this.setMoveSpeed($gamePlayer.realMoveSpeed());
};

Kien.PixelMovement.Game_Follower_moveDiagonally = Game_Follower.prototype.moveDiagonally;
Game_Follower.prototype.moveDiagonally = function(horz, vert, hdis, vdis) {
    Kien.PixelMovement.Game_Follower_moveDiagonally.apply(this, arguments);
    if (this.isMovementSucceeded()) {
        this._followerMovements.push([horz, vert, hdis, vdis]);
        this._pixelMoveData._movedDistance += Math.sqrt(hdis * hdis + vdis * vdis);
    }
}

//-----------------------------------------------------------------------------
// Game_Followers
//
// The wrapper class for a follower array.

Game_Followers.prototype.synchronize = function(x, y, d) {
    this.forEach(function(follower) {
        follower.locate(x, y);
        follower.setDirection(d);
        follower._pixelMoveData._movedDistance = 0;
    }, this);
};

//-----------------------------------------------------------------------------
// Game_Vehicle
//
// The game object class for a vehicle.

Game_Vehicle.prototype.positionRect = function() {
    if (this._mapId === $gameMap.mapId()) {
        return Game_Character.prototype.positionRect.call(this);
    } else {
        return new Kien.MovingRectangle(0,0,0,0);
    }
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
    return this.roundX(mapX);
};

Game_Map.prototype.canvasToMapY = function(y) {
    var tileHeight = this.tileHeight();
    var originY = this._displayY * tileHeight;
    var mapY = (originY + y) / tileHeight;
    return this.roundY(mapY);
};

Game_Map.prototype.mapToCanvasX = function(x) {
    var tw = this.tileWidth();
    return (this.adjustX(x) * tw + tw / 2);
};

Game_Map.prototype.mapToCanvasY = function(y) {
    var th = this.tileHeight();
    return (this.adjustY(y) * th + th / 2);
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
    return Kien.PixelMovement.Game_Map_eventsXy.apply(this, arguments);
};

Kien.PixelMovement.Game_Map_eventsXyNt = Game_Map.prototype.eventsXyNt;
Game_Map.prototype.eventsXyNt = function(x, y) {
    return Kien.PixelMovement.Game_Map_eventsXyNt.apply(this, arguments);
};

Kien.PixelMovement.Game_Map_layeredTiles = Game_Map.prototype.layeredTiles;
Game_Map.prototype.layeredTiles = function(x, y) {
    return Kien.PixelMovement.Game_Map_layeredTiles.apply(this, arguments);
};

Kien.PixelMovement.Game_Map_tileId = Game_Map.prototype.tileId;
Game_Map.prototype.tileId = function(x, y, z) {
    return Kien.PixelMovement.Game_Map_tileId.apply(this, arguments);
};

Game_Map.prototype.obtainTerrainBoundbox = function(rect) {
    var sx = Math.floor(rect.left);
    var sy = Math.floor(rect.top);
    var ex = Math.floor(rect.right);
    var ey = Math.floor(rect.bottom);
    var boundary = new Kien.Boundary();
    var flags = this.tilesetFlags();
    for (var yi = sy; yi <= ey; yi++) {
        var ty = (yi + this.height()) % this.height();
        for (var xi = sx; xi <= ex; xi++) {
            var tx = (xi + this.width()) % this.width();
            var tiles = this.allTiles(tx, ty);
            for (var i = 0; i < tiles.length; i++) {
                var flag = flags[tiles[i]];
                if ((flag & 0x10) !== 0)  // [*] No effect on passage
                    continue;
                if (flag & 0x01) {
                    boundary.addBoundbox(new Kien.MovingRectangle(xi, yi + 0.95, 1, 0.05));
                }
                if (flag & 0x02) {
                    boundary.addBoundbox(new Kien.MovingRectangle(xi, yi, 0.05, 1));
                }
                if (flag & 0x04) {
                    boundary.addBoundbox(new Kien.MovingRectangle(xi+0.95, yi, 0.05, 1));
                }
                if (flag & 0x08) {
                    boundary.addBoundbox(new Kien.MovingRectangle(xi, yi, 1, 0.05));
                }
                break;
            }
        }
    }
    return boundary;
}

Game_Map.prototype.obtainAllCollidedCharacter = function(rect) {
    return this.events().filter(function(event) {
        return rect.overlap(event.positionRect());
    })
}

Game_Map.prototype.isCollidedWithEvents = function(rect) {
    return this.events().some(function(event) {
        return event.overlap(rect);
    })
}

Game_Map.prototype.isCollidedWithEventsWithPriority = function(rect, normal) {
    return this.events().some(function(event) {
        return event.overlap(rect) && event.isNormalPriority() == normal;
    })
}

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Kien.PixelMovement.Sprite_Character_updateOther = Sprite_Character.prototype.updateOther;
Sprite_Character.prototype.updateOther = function() {
    Kien.PixelMovement.Sprite_Character_updateOther.apply(this, arguments);
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

//-----------------------------------------------------------------------------
// Sprite_Destination
//
// The sprite for displaying the destination place of the touch input.

Sprite_Destination.prototype.updatePosition = function() {
    var tileWidth = $gameMap.tileWidth();
    var tileHeight = $gameMap.tileHeight();
    var x = Math.floor($gameTemp.destinationX()) + 0.5;
    var y = Math.floor($gameTemp.destinationY()) + 0.5;
    this.x = ($gameMap.adjustX(x)) * tileWidth;
    this.y = ($gameMap.adjustY(y)) * tileHeight;
};

Sprite_Destination.prototype.createBitmap = function() {
    var tileWidth = $gameMap.tileWidth();
    var tileHeight = $gameMap.tileHeight();
    this.bitmap = new Bitmap(tileWidth, tileHeight);
    this.bitmap.drawCircle(tileWidth/2,tileHeight/2,Math.sqrt(tileWidth*tileWidth+tileHeight*tileHeight)/4,"white");
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.blendMode = Graphics.BLEND_ADD;
};
