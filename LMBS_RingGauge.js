//=============================================================================
// LMBS RingGauge
// LMBS_RingGauge.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_LMBS_RingGauge = true;

var Kien = Kien || {};
Kien.LMBS_RingGauge = {};
//=============================================================================
/*:
 * @plugindesc Change the gauge in battle screen to ring-shaped gauge.
 * @author Kien

 * @param Cursor Frame Count
 * @desc frame amount of system/cursor.png
 * @default 4
 *
 * @param Cursor Animation Speed
 * @desc Animation speed of cursor animation. higher value means slower animation.
 * @default 8
 *
 *
 */

Kien.LMBS_RingGauge.parameters = PluginManager.parameters("LMBS_RingGauge");
Kien.LMBS_RingGauge.cursorFrameCount = parseInt(Kien.LMBS_RingGauge.parameters["Cursor Frame Count"],10);
Kien.LMBS_RingGauge.cursorAnimationSpeed = parseInt(Kien.LMBS_RingGauge.parameters["Cursor Animation Speed"],10);

//-----------------------------------------------------------------------------
// Game_Battler
//
// The superclass of Game_Actor and Game_Enemy. It contains methods for sprites
// and actions.

Kien.LMBS_RingGauge.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers = function() {
    Kien.LMBS_RingGauge.Game_Battler_initMembers.apply(this, arguments);
    this.hpIgnoreAmount = 0;
    this.mpIgnoreAmount = 0;
    this.tpIgnoreAmount = 0;
};

Kien.LMBS_RingGauge.Game_Battler_regenerateHp = Game_Battler.prototype.regenerateHp;
Game_Battler.prototype.regenerateHp = function() {
    var t = this.hp;
    Kien.LMBS_RingGauge.Game_Battler_regenerateHp.apply(this, arguments);
    this.hpIgnoreAmount += this.hp - t;
};

Kien.LMBS_RingGauge.Game_Battler_regenerateMp = Game_Battler.prototype.regenerateMp;
Game_Battler.prototype.regenerateMp = function() {
    var t = this.mp;
    Kien.LMBS_RingGauge.Game_Battler_regenerateMp.apply(this, arguments);
    this.mpIgnoreAmount += this.mp - t;
};

Kien.LMBS_RingGauge.Game_Battler_regenerateTp = Game_Battler.prototype.regenerateTp;
Game_Battler.prototype.regenerateTp = function() {
    var t = this.tp;
    Kien.LMBS_RingGauge.Game_Battler_regenerateTp.apply(this, arguments);
    this.tpIgnoreAmount += this.tp - t;
};

//-----------------------------------------------------------------------------
// Window_BattleStatusLMBS
//
// Window Use to show Battler Status.

function Window_BattleStatusLMBS() {
    this.initialize.apply(this, arguments);
}

Window_BattleStatusLMBS.prototype = Object.create(Window_Selectable.prototype);
Window_BattleStatusLMBS.prototype.constructor = Window_BattleStatusLMBS;

Window_BattleStatusLMBS.prototype.initialize = function() {
    var h = 128;
    var w = Graphics.boxWidth;
    var y = Graphics.boxHeight - h;
    Window_Selectable.prototype.initialize.call(this,0,y,w,h);
    this.deactivate();
    this.width = w;
    this.height = h;
    this.y = y;
    //this.backOpacity = 0;
    this.opacity = 0;
    this.sprites = [];
    this.createContents();
    this.createSprites();
    this.refresh();
};

Window_Base.prototype.drawFaceToBitmap = function(dest, faceName, faceIndex, x, y, width, height) {
    width = width || Window_Base._faceWidth;
    height = height || Window_Base._faceHeight;
    var bitmap = ImageManager.loadFace(faceName);
    var pw = Window_Base._faceWidth;
    var ph = Window_Base._faceHeight;
    var sw = Math.min(width, pw);
    var sh = Math.min(height, ph);
    var dx = Math.floor(x + Math.max(width - pw, 0) / 2);
    var dy = Math.floor(y + Math.max(height - ph, 0) / 2);
    var sx = faceIndex % 4 * pw + (pw - sw) / 2;
    var sy = Math.floor(faceIndex / 4) * ph + (ph - sh) / 2;
    dest.blt(bitmap, sx, sy, sw, sh, dx, dy);
};

Window_BattleStatusLMBS.prototype.createSprites = function() {
    for (var i = 0; i < this.maxItems(); i++) {
        var actor = $gameParty.battleMembers()[i];
        this.sprites[i] = new Sprite_RingGaugeLMBS(actor);
        //this.sprites[i].ringFilter.enabled = false;
        this.sprites[i].x = this.itemRect(i).x + this.standardPadding();
        this.addChild(this.sprites[i]);
    }
    if (!Graphics.isWebGL()) {
        this._gaugeSprites = [];
        var pl = ["hp", "tp"];
        var plm = ["mhp", "maxTp"];
        var pil = ['hpIgnoreAmount', 'tpIgnoreAmount'];
        var cl = ['greenyellow','red','green','yellow','red','orange'];
        for (var i = 0; i < this.maxItems(); i++) {
            var actor = $gameParty.battleMembers()[i];
            this._gaugeSprites[i] = new Sprite_GaugeLMBS(actor, 125, 10, pl, plm, pil, cl);
            //this.sprites[i].ringFilter.enabled = false;
            this._gaugeSprites[i].x = this.itemRect(i).x + this.standardPadding();
            this._gaugeSprites[i].y = this.sprites[i].height-10*2;
            this._gaugeSprites[i].refresh();
            this.addChild(this._gaugeSprites[i]);
        }
    }
    this.cursorSprite = new Sprite_TargetArrow();
    this.addChild(this.cursorSprite);
}

Window_BattleStatusLMBS.prototype.maxCols = function() {
    return 4;
};

Window_BattleStatusLMBS.prototype.maxItems = function() {
    return $gameParty.battleMembers().length;
}

Window_BattleStatusLMBS.prototype.drawGauge = function(x, y, width, rate, color1, color2) {
    var fillW = Math.floor(width * rate);
    var gaugeY = y;
    this.contents.fillRect(x, gaugeY, width, 6, this.gaugeBackColor());
    this.contents.gradientFillRect(x, gaugeY, fillW, 6, color1, color2);
};

Window_BattleStatusLMBS.prototype.drawItem = function(index) {
    var actor = $gameParty.battleMembers()[index];
    this.clearItem(index);
    var tw = Graphics.boxWidth / this.maxCols();
    var tx = tw * index + 15;
    this.drawFaceToBitmap(this.sprites[index].bitmap, actor.faceName(), actor.faceIndex(), 0, 0);
}

Window_BattleStatusLMBS.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    rect.width = 125;
    rect.x = this.contents.width / this.maxCols() * index + (this.contents.width / this.maxCols() - 125) / 2;
    rect.height = this.height;
    return rect;
}

Window_BattleStatusLMBS.prototype.clearItem = function(index) {
    var width = this.width / this.maxCols();
    var x = width * index;
    this.contents.clearRect(x,0,width,this.height);
}

Window_BattleStatusLMBS.prototype.selectLast = function() {
    this.select($gameParty._lastBattleActorIndexLMBS);
}

Window_BattleStatusLMBS.prototype.actor = function() {
    return $gameParty.battleMembers()[this.index()];
}

Window_BattleStatusLMBS.prototype.isCurrentItemEnabled = function() {
    return this.isEnabled(this.actor());
};

Window_BattleStatusLMBS.prototype.isEnabled = function(actor) {
    return true;
}

Window_BattleStatusLMBS.prototype.updateCursor = function() {
    this.setCursorRect(0, 0, 0, 0);
    if (this.cursorSprite) {
        if(this.isCursorVisible()) {
            var sp = this.sprites[this.index()];
            this.cursorSprite.x = sp.x + (sp.width-this.cursorSprite.width) / 2;
            this.cursorSprite.y = sp.y - this.cursorSprite.height;
            this.cursorSprite.visible = true;
        } else {
            this.cursorSprite.visible = false;
        }
    }
};

//-----------------------------------------------------------------------------
// Sprite_RingGaugeLMBS
//
// The sprite for displaying HP gauge in ring shape.
// Not usable when RingGauge.js is not added.

function Sprite_RingGaugeLMBS() {
    this.initialize.apply(this, arguments);
}
 
Sprite_RingGaugeLMBS.prototype = Object.create(Sprite_Base.prototype);
Sprite_RingGaugeLMBS.prototype.constructor = Sprite_RingGaugeLMBS;

Sprite_RingGaugeLMBS.prototype.initialize = function(battler) {
    Sprite_Base.prototype.initialize.call(this);
    this.battler = battler;
    this._propertyList = ['hp','mp','tp'];
    this._propertyMaxList = ['mhp','mmp','maxTp'];
    this._propertyIgnoreList = ['hpIgnoreAmount', 'mpIgnoreAmount', 'tpIgnoreAmount'];
    this._colorList = ['greenyellow','red','green','deepskyblue','red','skyblue','yellow','red','orange'];
    this._gaugeWidth = 20
    this._gaugeEdgeWidth = 2;
    this.initializeProperties();
    this.createBitmap();
    this.createGaugeBitmap();
    this.createRingFilter();
}

Sprite_RingGaugeLMBS.prototype.initializeProperties = function() {
    this._current = [];
    this._max = [];
    this._diff = [];
    this._diffCount = [];
    this._diffDecCount = [];
    this._lastProperty = [];
    for (var i = 0; i < this._propertyList.length; i++) {
        this._current[i] = this.obtainProperty(this.battler, this._propertyList[i]);
        this._diff[i] = 0;
        this._diffCount[i] = 0;
        this._diffDecCount[i] = 0;
        this._max[i] = this.obtainProperty(this.battler, this._propertyMaxList[i]);
        this._lastProperty[i] = {c: -1, d: -1};
    }
}

Sprite_RingGaugeLMBS.prototype.obtainProperty = function(obj, name) {
    var ret = obj[name];
    if (typeof ret === 'function') {
        ret = ret();
    }
    return ret;
}

Sprite_RingGaugeLMBS.prototype.setProperty = function(obj, name, value) {
    if (obj[name] !== undefined) {
        obj[name] = value;
    }
}

Sprite_RingGaugeLMBS.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(125, 125);
}

Sprite_RingGaugeLMBS.prototype.createGaugeBitmap = function() {
    this.gaugeBitmap = new Bitmap(125,this._current.length * this._gaugeWidth);
    this.gaugeBitmap.fontSize = 8;
}

Sprite_RingGaugeLMBS.prototype.createRingFilter = function() {
    this.ringFilter = new Kien.RingGauge.RingFilter();
    this.ringFilter.gauge = this.gaugeBitmap;
    this.ringFilter.startRadius = 0.2;
    this.ringFilter.endRadius = 0.2 + 0.04 * this._current.length;
    this.ringFilter.endRadian = Math.PI * 2.75;
    this.ringFilter.startRadian = Math.PI * 1.5;
    this.filters = [this.ringFilter];
}

Sprite_RingGaugeLMBS.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    if (Graphics.isWebGL()) {
        this.updateProperty();
        this.updateBitmap();
    }
}

Sprite_RingGaugeLMBS.prototype.updateProperty = function() {
    for (var i = 0; i < this._current.length; i++) {
        var bc = this.obtainProperty(this.battler, this._propertyList[i]);
        var ignore = this.obtainProperty(this.battler, this._propertyIgnoreList[i]);
        if (bc - this._current[i] - ignore === 0) {
            this._current[i] = bc;
            this.setProperty(this.battler, this._propertyIgnoreList[i], 0);
        } else if (this._current[i] != bc) {
            this._diff[i] += this._current[i] - bc - ignore;
            this._current[i] = bc;
            this.setProperty(this.battler, this._propertyIgnoreList[i], 0);
            this._diffCount[i] = 30;
        }
        if (this._diffCount[i] > 0) {
            this._diffCount[i]--;
            if (this._diffCount[i] == 0) {
                this._diffDecCount[i] = 15;
            }
        } else {
            if (this._diff[i] != 0) {
                this._diff[i] -= this._diff[i] / this._diffDecCount[i];
                this._diffDecCount[i]--;
                if (this._diffDecCount[i] == 0) {
                    this._diff[i] = 0;
                }
            }
        }
    }
}

Sprite_RingGaugeLMBS.prototype.updateBitmap = function() {
    for (var i = 0; i < this._current.length; i++) {
        if (this._lastProperty[i].d != this._diff[i] || this._lastProperty[i].c != this._current[i]) {
            this._lastProperty[i].d = this._diff[i];
            this._lastProperty[i].c = this._current[i];
            this.gaugeBitmap.clearRect(0,i*this._gaugeWidth,this.gaugeBitmap.width,this._gaugeWidth);
            this.gaugeBitmap.fillRect(0,i*this._gaugeWidth,this.gaugeBitmap.width,this._gaugeWidth,"black");
            var gw = this._current[i] / this._max[i] * this.gaugeBitmap.width;
            this.gaugeBitmap.fillRect(0,i*this._gaugeWidth + this._gaugeEdgeWidth,gw,this._gaugeWidth - this._gaugeEdgeWidth * 2,this._colorList[i*3]);
            var dw = this._diff[i] / this._max[i] * this.gaugeBitmap.width;
            this.gaugeBitmap.fillRect(gw,i*this._gaugeWidth + this._gaugeEdgeWidth,dw,this._gaugeWidth - this._gaugeEdgeWidth * 2, this._diff[i] > 0 ? this._colorList[i*3+1] : this._colorList[i*3+2]);
            this.gaugeBitmap.checkDirty();
        }
    }
}
