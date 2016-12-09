//=============================================================================
// Fix Mirrored Animation
// MirrorAnimationFix.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_MirrorAnimationFix = true;

var Kien = Kien || {};
Kien.MirroredAnimation = {};
//=============================================================================
/*:
 * @plugindesc Fix A bug that animatio will show wrong when used mirror in script.
 * @author Kien
 *
 */

Kien.MirroredAnimation.Sprite_Animation_setup = Sprite_Animation.prototype.setup;
Sprite_Animation.prototype.setup = function(target, animation, mirror, delay) {
    Kien.MirroredAnimation.Sprite_Animation_setup.apply(this,arguments);
    if (this._animation && this._mirror){
        this.scale.x = -1;
    }
};

Sprite_Animation.prototype.updateCellSprite = function(sprite, cell) {
    var pattern = cell[0];
    if (pattern >= 0) {
        var sx = pattern % 5 * 192;
        var sy = Math.floor(pattern % 100 / 5) * 192;
        var mirror = this._mirror;
        sprite.bitmap = pattern < 100 ? this._bitmap1 : this._bitmap2;
        sprite.setFrame(sx, sy, 192, 192);
        sprite.x = cell[1];
        sprite.y = cell[2];
        sprite.rotation = cell[4] * Math.PI / 180;
        sprite.scale.x = cell[3] / 100;
        if (cell[5]) {
            sprite.scale.x *= -1;
        }
        sprite.scale.y = cell[3] / 100;
        sprite.opacity = cell[6];
        sprite.blendMode = cell[7];
        sprite.visible = this._target.visible;
    } else {
        sprite.visible = false;
    }
};