//=============================================================================
// Picture Follow Event
// PictureFollowEvent.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_PictureFollowEvent = true;

var Kien = Kien || {};
Kien.PictureFollowEvent = {};
//=============================================================================
/*:
 * @plugindesc Allow to bind picture with event so picture will move as event move.
 * @author Kien
 * @help
*/

Game_Screen.prototype.pictureFollow = function(pictureId,eventId) {
    this.picture(pictureId).followEvent(eventId);
};

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

Kien.PictureFollowEvent.Game_Picture_initTarget = Game_Picture.prototype.initTarget;
Game_Picture.prototype.initTarget = function() {
	Kien.PictureFollowEvent.Game_Picture_initTarget.apply(this, arguments);
    this._followingEventId = -1;
    this._followingLastX = 0;
    this._followingLastY = 0;
};

Kien.PictureFollowEvent.Game_Picture_updateMove = Game_Picture.prototype.updateMove;
Game_Picture.prototype.updateMove = function() {
	Kien.PictureFollowEvent.Game_Picture_updateMove.apply(this, arguments);
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
