//=============================================================================
// Side Scroll Action System
// Side Scroll Action.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_SSA = true;

var Kien = Kien || {};
Kien.SSA = {};
//=============================================================================
/*:
 * @plugindesc A side scroll system
 * @author Kien
 *
 * @param Enabled Default
 * @desc Enable the system by default.
 * @default false

*/

Kien.SSA.parameters = PluginManager.parameters("Side Scroll Action");
Kien.SSA.enableDefault = eval(Kien.SSA.parameters["Enabled Default"]);

if (!Kien.LMBS_Core) {
    Kien.LMBS_Core = {};
    Kien.LMBS_Core.createMotionListFromNote = function(obj) {
        if(obj.note === undefined || obj.note === null){
            throw new TypeError('obj is not a proper Object');
        }
        var array = [];
        var list = [];
        var start = false;
        obj.note.split("\n").forEach(function(line){
            if(line.match(/\<Skill Motion\>/)){
                start = true;
            } else if(line.match(/\<\/Skill Motion\>/)){
                start = false;
            } else if(start){
                array.push(line);
            }
        });
        if(array.length === 0){
            if (obj.meta["Skill Motion"]){
                var fn = obj.meta["skill Motion"];
                var fpath = "data/motions/" + fn + ".json";
                var xhr = new XMLHttpRequest();
                var url = fpath;
                xhr.open('GET', url, false);
                xhr.overrideMimeType('application/json');
                xhr.onload = function() {
                    if (xhr.status < 400) {
                        list = JSON.parse(xhr.responseText);
                    }
                };
                xhr.onerror = function() {
                    DataManager._errorUrl = DataManager._errorUrl || url;
                };
                xhr.send();
            }
        } else {
            Kien.LMBS_Core.loadMotionList(array,list);
        }
        return list;
    };

    Kien.LMBS_Core.createAnimationTimingFromName = function(filename) {
        if (filename === "null") {
            return {};
        }
        var fpath = "data/animations/" + filename + ".json";
        var obj = {};
        var xhr = new XMLHttpRequest();
        var url = fpath;
        xhr.open('GET', url, false);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                obj = JSON.parse(xhr.responseText);
            }
        };
        xhr.onerror = function() {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        xhr.send();
        return obj;
    };

    Kien.LMBS_Core.getSkillPriority = function(obj) {
        if(obj.note === undefined || obj.note === null){
            throw new TypeError('obj is not a proper Object');
        }
        if(obj.meta["Skill Priority"]){
            return parseInt(obj.meta["Skill Priority"],10);
        }
        return 0;
    };

    Kien.LMBS_Core.getSkillRange = function(obj) {
        if(obj.note === undefined || obj.note === null){
            throw new TypeError('obj is not a proper Object');
        }
        if(obj.meta["Skill Range"]){
            return parseInt(obj.meta["Skill Range"],10);
        }
        var list = Kien.LMBS_Core.createMotionListFromNote(obj);
        for (var index = 0; index < list.length; index++){
            obj = list[index];
            if (obj.type == "startdamage") {
                var x = obj.rect.x;
                var w = obj.rect.width;
                return x+w/2;
            }
        }
        return 20
    };

    Kien.LMBS_Core.isTest = function() {
        return Utils.isOptionValid('test') && Kien.LMBS_Core.debugMode;
    };

    Kien.LMBS_Core.inBetween = function(a, b, value) {
        if (a > b){
            return (value >= b) && (value < a);
        } else {
            return (value >= a) && (value < b);
        }
    };

    Kien.LMBS_Core.loadMotionList = function(array, list) {
        var tree = [];
        var cur = {"list" : list, "newDepth" : false, "finish" : false};
        for (var index = 0; index < array.length; index++){
            line = array[index];
            Kien.LMBS_Core.loadMotionLine(line, cur);
            if (cur.newDepth) {
                cur.newDepth = false;
                tree.push(cur);
                cur = {"list" : cur.list[cur.list.length - 1].list || [], "newDepth" : false, "finish" : false};
            } else if (cur.finish) {
                if (tree.length > 0) {
                    cur = tree.pop();
                } else {
                    console.log("Skill Motion have extra EndIf statement, ignoring it.");
                }
            }
        }
        if (tree.length > 0) {
            console.log("Error! Skill Motion have too little EndIf statement! Something will go wrong.")
        }
    }

    Kien.LMBS_Core.loadMotionLine = function(line,cur) {
        var list = cur.list;
        if(line.match(/ChangePose (.+)/)) {
            list.push({
                "type" : "pose",
                "name" : RegExp.$1
            });
        }
        if(line.match(/FrameForward/)) {
            list.push({
                "type" : "forward"
            });
        }
        if(line.match(/FrameBackward/)) {
            list.push({
                "type" : "backward"
            });
        }
        if(line.match(/Move ([+-]?\d+)\,([+-]?\d+)\,(\d+)/)) {
            list.push({
                "type" : "move",
                "dx"   : parseInt(RegExp.$1,10),
                "dy"   : parseInt(RegExp.$2,10),
                "dur"  : parseInt(RegExp.$3,10)
            });
        }
        if(line.match(/Wait (\d+)/)) {
            list.push({
                "type" : "wait",
                "dur"  : parseInt(RegExp.$1)
            });
        }
        if(line.match(/StartInput/)) {
            list.push({
                "type" : "startinput"
            });
        }
        if(line.match(/EndInput/)) {
            list.push({
                "type" : "endinput"
            });
        }
        if(line.match(/StartDamage ([+-]?\d+)\,([+-]?\d+)\,(\d+)\,(\d+)\,(\d+(?:\.\d+)?)\,(\d+)\,(\d+)\,(\d+)/)) {
            list.push({
                "type" : "startdamage",
                "rect" : {"x":     parseFloat(RegExp.$1,10),
                "y":     parseFloat(RegExp.$2,10),
                "width": parseFloat(RegExp.$3,10),
                "height":parseFloat(RegExp.$4,10)},
                "damage": parseFloat(RegExp.$5),
                "knockback": {"x": parseFloat(RegExp.$6,10),"y": parseFloat(RegExp.$7,10)},
                "knockdir": RegExp.$8 ? parseInt(RegExp.$8,10) : 0
            });
        }
        if(line.match(/EndDamage/)) {
            list.push({
                "type" : "enddamage"
            });
        }
        if(line.match(/Projectile (.+?)\,(.+)/)) {
            list.push({
                "type" : "projectile",
                "classname" : RegExp.$1,
                "parameters": RegExp.$2
            });
        }
        if(line.match(/LetFall/)) {
            list.push({
                "type" : "letfall"
            });
        }
        if(line.match(/NoFall/)) {
            list.push({
                "type" : "nofall"
            });
        }
        if(line.match(/WaitFall/)) {
            list.push({
                "type" : "waitfall",
                "dur" : 1
            });
        }
        if(line.match(/ApplyDamage (\d+(?:\.\d+)?)\,(\d+)\,(\d+)\,(\d+)/)){
            list.push({
                "type" : "applydamage",
                "damage" : parseFloat(RegExp.$1),
                "knockback": {"x" : parseFloat(RegExp.$2,10), "y" : parseFloat(RegExp.$3,10)},
                "knockdir" : parseInt(RegExp.$4,10)
            });
        }
        if(line.match(/WaitCast (\d+)/)){
            list.push({
                "type" : "waitcast",
                "dur" : parseInt(RegExp.$1,10)
            });
        }
        if(line.match(/Rotation (\d+)\,([+-]\d+)\,(\d+)/)){
            list.push({
                "type" : "rotation",
                "rotation" : parseInt(RegExp.$1,10),
                "dir" : parseInt(RegExp.$2,10),
                "dur" : parseInt(RegExp.$3,10),
            });
        }
        if(line.match(/SetHitStop (\d+)/)) {
            list.push({
                "type" : "sethitstop",
                "length" : parseInt(RegExp.$1,10)
            });
        }
        if(line.match(/StopAllAi/)) {
            list.push({
                "type" : "stopallai"
            });
        }
        if(line.match(/StartAllAi/)) {
            list.push({
                "type" : "startallai"
            });
        }
        if (line.match(/^If (.+)/)){
            list.push({
                "type" : "if",
                "expression" : RegExp.$1,
                "list" : []
            });
            cur.newDepth = true;
        }
        if (line.match(/^EndIf/)){
            list.push({
                "type" : "endif"
            });
            cur.finish = true;
        }
        if(line.match(/(?:ChangeWeapon$|(?:ChangeWeapon[ ]?(.+)))/)) {
            list.push({
                "type" : "changeweapon",
                "name" : RegExp.$1
            });
        }
        Kien.LMBS_Core.loadExtraLine(line,cur);
    }

    Kien.LMBS_Core.loadExtraLine = function(line, cur) {

    }

    Kien.LMBS_Core.loadMotionDescriptorClass = function(obj) {
        if (obj.meta["Motion Descriptor"]) {
            return eval(obj.meta["Motion Descriptor"]);
        }
        return DefaultMotionDescriptor;
    }
}

//-----------------------------------------------------------------------------
// Array
//
// Define a utility Function.

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
};

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
};

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
};

if (!Array.prototype.sample) {
    Array.prototype.sample = function() {
        if (this === null) {
          throw new TypeError('Array.prototype.sample called on null or undefined');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var value;
        if (length === 0){
            return undefined;
        }
        var index = Math.floor( Math.random() * length);
        return list[index];
    };
};

if (!Array.prototype.clear) {
    Array.prototype.clear = function() {
        this.splice(0,this.length);
    }
}

//-----------------------------------------------------------------------------
// Rectangle
//
// Define a utility Function.

Object.defineProperty(Rectangle.prototype, 'cx', {
    get: function() {
        return this.x + this.width/2;
    },
    configurable: true
});

Object.defineProperty(Rectangle.prototype, 'cy', {
    get: function() {
        return this.y + this.height/2;
    },
    configurable: true
});

Rectangle.prototype.overlap = function(other) {
    return (Math.abs(this.cx - other.cx) <= (this.width/2 + other.width/2)) && (Math.abs(this.cy - other.cy) <= (this.height/2 + other.height/2))
};

Rectangle.prototype.clone = function() {
    var rect = new Rectangle(0,0,0,0);
    rect.x = this.x;
    rect.y = this.y;
    rect.width = this.width;
    rect.height = this.height;
    return rect;
};

//-----------------------------------------------------------------------------
// JSON
//
// Define a utility Function.

if (!window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              if (value.hasOwnProperty(k))
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
};

DataManager._databaseFiles.push({ name: '$dataLMBSCharacters',       src: 'characterList.json'       });

//-----------------------------------------------------------------------------
// ImageManager
//
// The static class that loads images, creates bitmap objects and retains them.

ImageManager.loadProjectile = function(filename, hue) {
    return this.loadBitmap('img/projectile/', filename, hue, false);
};

ImageManager.loadWeapon = function(filename) {
    return this.loadBitmap('img/weapons/', filename, 0, false);
};

//-----------------------------------------------------------------------------
// Game_System
//
// The game object class for the system data.

Kien.SSA.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    Kien.SSA.Game_System_initialize.apply(this);
    this._ssaEnabled = Kien.SSA.enableDefault;
}

//-----------------------------------------------------------------------------
// AbstractMotionDescriptor
//
// Base class for motion descriptor.

function AbstractMotionDescriptor() {
    this.initialize.apply(this, arguments);
}

AbstractMotionDescriptor.prototype.initialize = function(battler) {
    this._battler = battler;
    this._finish = false;
    this._waitCount = 0;
}

AbstractMotionDescriptor.prototype.isWait = function() {
    if (this._waitCount > 0) {
        this._waitCount -= 1;
        return true;
    }
    return false;
}

AbstractMotionDescriptor.prototype.wait = function(duration) {
    this._waitCount = duration;
}

AbstractMotionDescriptor.prototype.isFinish = function() {
    return this._finish;
}

AbstractMotionDescriptor.prototype.release = function() {
    this._battler = null;
}

// Defined as a "Default" condition, override this function if needed.
AbstractMotionDescriptor.prototype.canUse = function(battler, obj) {
    var bool = false
    if(DataManager.isSkill(obj)){
        bool = battler.meetsSkillConditions(obj);
    } else if (DataManager.isItem(obj)){
        bool = battler.meetsItemConditions(obj);
    }
    if(!bool){
        return bool;
    }
    bool = (!battler.isMotion() || battler._waitInput);
    if(!bool){
        return bool;
    }
    bool = !battler.isKnockback() && !battler.isGuard();
    if (!bool) {
        return bool;
    }
    if(battler.currentAction() && battler.isMotion()){
        var now = battler.currentAction().item();
        var pri1 = Kien.LMBS_Core.getSkillPriority(now);
        var pri2 = Kien.LMBS_Core.getSkillPriority(obj);
        bool = (pri1 != -1 ) && ((pri1 == 0 && pri2 == 0) || (pri2 > pri1) || (pri2 < 0));
    }
    if (!bool){
        return bool;
    }
    if (!battler.isGround()) {
        bool = obj.meta["Aerial Cast"] ? true : false ;
    }
    return bool;
}

//-----------------------------------------------------------------------------
// DefaultMotionDescriptor
//
// Motion descriptor for default skill motions.

function DefaultMotionDescriptor() {
    this.initialize.apply(this, arguments);
}

DefaultMotionDescriptor.prototype = Object.create(AbstractMotionDescriptor.prototype);
DefaultMotionDescriptor.prototype.constructor = DefaultMotionDescriptor;

DefaultMotionDescriptor.prototype.initialize = function (battler) {
    AbstractMotionDescriptor.prototype.initialize.apply(this,arguments);
    this._childDescriptor = null;
    var item = this._battler.currentAction().item();
    if (!this._battler.isGround()) {
        var id = parseInt(item.meta["Aerial Cast"],10);
        if (id > 0) {
            this._skillToBeCast = id;
            this._skillToBeCastIsItem = DataManager.isItem(item);
        }
    }
    this._processingMotionList = [];
    this._motionList = Kien.LMBS_Core.createMotionListFromNote(item);
    if (DataManager.isSkill(item)) {
        this._battler.paySkillCost(item);
    } else {
        this._battler.consumeItem(item);
    }
}

DefaultMotionDescriptor.prototype.update = function(){
    if (this._skillToBeCast) {
        this._finish = true;
        if (this._skillToBeCastIsItem) {
            this._battler.forceItemLMBS(this._skillToBeCast);
        } else {
            this._battler.forceSkill(this._skillToBeCast);
        }
        return;
    }
    if (this._childDescriptor != null) {
        this._childDescriptor.update();
        if (this._childDescriptor.isFinish()) {
            this._childDescriptor = null;
        } else {
            return;
        }
    }
    if (this._motionList.length > 0 && (!this.motionWaiting())){
        var obj = this._motionList.shift();
        while(obj){
            obj = (this.processMotion(obj) ? undefined : this._motionList.shift());
        }
    }
    this.updateProcessingMotion();
    if(this._motionList.length === 0 && this._processingMotionList.length === 0){
        this._finish = true;
    }
}

// Process motion executing in list
// returning true to abort process. Currently only occurs at "wait" command.
DefaultMotionDescriptor.prototype.processMotion = function(obj) {
    switch(obj.type){
        case "pose":
            this._battler._pose = obj.name;
            this._battler._patternIndex = 0;
            break;
        case "forward":
            this._battler._patternIndex++;
            break;
        case "backward":
            if (this._battler._patternIndex > 0){
                this._battler._patternIndex--;
            }
            break;
        case "move":
            this._processingMotionList.push(Object.create(obj));
            break;
        case "wait":
            this._processingMotionList.push(Object.create(obj));
            return true;
        case "startinput":
            this._battler._waitInput = true;
            break;
        case "endinput":
            this._battler._waitInput = false;
            break;
        case "startdamage":
            this._battler.startDamage(Object.create(obj));
            break;
        case "enddamage":
            this._battler.clearDamage();
            break;
        case "projectile":
            this._battler.registProjectile(Object.create(obj));
            break;
        case "letfall":
            this._battler._motionFall = true;
            break;
        case "nofall":
            this._battler._motionFall = false;
            break;
        case "waitfall":
            this._processingMotionList.push(Object.create(obj));
            return true;
        case "applydamage":
            if(this._battler._target){
                var oldd, oldk, oldkd, dmg;
                if (this._battler.isDamaging()){
                    dmg = true;
                    oldd = this._battler.currentAction()._damagePercentage;
                    oldk = this._battler._damageInfo.knockback;
                    oldkd = this._battler._damageInfo.knockdir;
                } else {
                    this._battler._damageInfo = {};
                    dmg = false;
                }
                this._battler.currentAction()._damagePercentage = obj.damage;
                this._battler._damageInfo.knockback = obj.knockback;
                this._battler._damageInfo.knockdir = obj.knockdir;
                this._battler.forceDamage(this._battler._target);
                if (dmg){
                    this._battler.currentAction()._damagePercentage = oldd;
                    this._battler._damageInfo.knockback = oldk;
                    this._battler._damageInfo.knockdir = oldkd;
                } else {
                    this._battler.currentAction()._damagePercentage = 1.0;
                    this._battler._damageInfo = null;
                }
            }
            break;
        case "waitcast":
            this._battler._pose = "Cast";
            this._battler._patternIndex = -1;
            this._processingMotionList.push(Object.create(obj));
            return true;
        case "rotation":
            this._processingMotionList.push(Object.create(obj));
            break;
        case "sethitstop":
            this._battler._hitStopLength = obj.length;
            break;
        case "if":
        // Something similar to default damage formula :p
            var a = this._battler;
            var b = a._target;
            var v = $gameVariables._data;
            if (eval(obj.expression)){
                this._childDescriptor = new ChildDefaultMotionDescriptor(this._battler, obj.list);
            }
            break;
        case "endif":
        // Do nothing in DefaultMotionDescriptor, as this is not in a if statement.
            break;
        case "changeweapon":
            this._battler._weaponName = obj.name;
            break;
    }
    return false;
}

DefaultMotionDescriptor.prototype.updateProcessingMotion = function() {
    this._processingMotionList.forEach(this.processProcessingMotion, this)
    var callback = function (obj){
        return obj.dur == 0;
    }
    var index = this._processingMotionList.findIndex(callback);
    while(index != -1){
        this._processingMotionList.splice(index,1);
        index = this._processingMotionList.findIndex(callback);
    }
}

// Process your motion need various frames at here
// Remember to include a "dur" property and set it to 0 when the process is finish.
DefaultMotionDescriptor.prototype.processProcessingMotion = function(obj) {
    switch(obj.type){
        case "wait":
            obj.dur--;
            break;
        case "move":
            var ddx = obj.dx / obj.dur;
            var ddy = obj.dy / obj.dur;
            this._battler.forceMoveWith(ddx * (this._battler._facing ? 1 : -1));
            this._battler._battleY += ddy;
            obj.dx -= ddx;
            obj.dy -= ddy;
            obj.dur--;
            break;
        case "rotation":
            if (this._battler._rotation == obj.rotation) {
                var dir = obj.dir > 0 ? (this._battler._facing ? 4 : 6) : (this._battler._facing ? 6 : 4);
                if (dir == 6) {
                    this._battler._rotation += 360;
                } else {
                    obj.rotation += 360;
                }
            }
            var dr = this._battler._rotation - obj.rotation;
            this._battler._rotation += (dir-5)*-1 * dr/obj.dur;
            obj.dur--;
            break;
        case "waitfall":
            if(this._battler.isGround() || !this._battler._motionFall){
                obj.dur = 0;
            }
            break;
        case "waitcast":
            obj.dur--;
            if(obj.dur == 0){
                this._battler._patternIndex = 0;
            }
            break;
    }
}

DefaultMotionDescriptor.prototype.motionWaiting = function() {
    return (this._processingMotionList.find(function(obj){
        return obj.type.match(/wait/) != null;
    }) !== undefined);
}

//-----------------------------------------------------------------------------
// ChildDefaultMotionDescriptor
//
// Base class for motion descriptor.

function ChildDefaultMotionDescriptor() {
    this.initialize.apply(this, arguments);
}

ChildDefaultMotionDescriptor.prototype = Object.create(DefaultMotionDescriptor.prototype);
ChildDefaultMotionDescriptor.prototype.constructor = ChildDefaultMotionDescriptor;

ChildDefaultMotionDescriptor.prototype.initialize = function (battler, list) {
    AbstractMotionDescriptor.prototype.initialize.apply(this,arguments);
    this._stoppedAi = false;
    this._processingMotionList = [];
    this._motionList = list;
    this._childDescriptor = null;
}

ChildDefaultMotionDescriptor.prototype.processMotion = function(obj) {
    switch(obj.type){
        case "endif":
            this._finish = true;
            break;
    }
    return DefaultMotionDescriptor.prototype.processMotion.call(this, obj);
}

//-----------------------------------------------------------------------------
// Game_MotionSubject
//
// The game object class for controlling Game_Character object with side scroll
// Action properties;

function Game_MotionSubject() {
    this.initialize.apply(this, arguments);
}

Game_MotionSubject.prototype.initialize = function() {
    this._battleX = 0;
    this._battleY = 0;
    this._target = null;
    this._rotation = 0;
    this._facing = false;
    this._item = null;
    this._damagePercentage = 1;
    this._projectiles = [];
    this.clearMotionData();
}

Game_MotionSubject.prototype.clearMotionData = function() {
    this._patternIndex = -1;
    this._pose = "Stand";
    this._weaponName = null;
    this._waitInput = false;
    this._motionFall = false;
    this._hitStopLength = 4;
    this._damageInfo = null;
    this._skillMotionDescriptor = null;
}

Game_MotionSubject.prototype.currentAction = function() {
    return this;
}

Game_MotionSubject.prototype.item = function() {
    return this._item;
}

Game_MotionSubject.prototype.isGround = function() {
    return true;
}

Game_MotionSubject.prototype.update = function() {
    this.updateMotion();
}

Game_MotionSubject.prototype.updateMotion = function() {
    if (this.isMotion()) {
        if (this._skillMotionDescriptor.isFinish()) {
            this.clearMotionData();
        } else {
            this._skillMotionDescriptor.update();
        }
    }
}

Game_MotionSubject.prototype.isDamaging = function() {
    return this._damageInfo !== null;
}

Game_MotionSubject.prototype.isMotion = function() {
    return this._skillMotionDescriptor !== null;
}

Game_MotionSubject.prototype.paySkillCost = function(obj) {

} 

Game_MotionSubject.prototype.consumeItem = function(obj) {

}

Game_MotionSubject.prototype.loadMotionFromObject = function(obj) {
    this.clearMotionData();
    var klass = Kien.LMBS_Core.loadMotionDescriptorClass(obj);
    if (klass) {
        this._skillMotionDescriptor = new klass(this);
    }
}

Game_MotionSubject.prototype.useSkill = function(skillId){
    var skill = $dataSkills[skillId];
    if (skill && this.canUseLMBS(skill)){
        this._item = skill;
        BattleManager.refreshStatus();
    }
}

// Force the skill to be casted, without checkign the condition.
Game_MotionSubject.prototype.forceSkill = function(skillId){
    var skill = $dataSkills[skillId];
    if (skill){
        this._item = skill;
        BattleManager.refreshStatus();
    }
}

Game_MotionSubject.prototype.useItemLMBS = function(itemId){
    var item = $dataItems[itemId];
    if (item && this.canUseLMBS(item)){
        this._item = item;
        this.loadMotionFromObject(item);
    }
}

Game_MotionSubject.prototype.forceItemLMBS = function(itemId){
    var item = $dataItems[itemId];
    if (item){
        this._item = item;
        this.loadMotionFromObject(item);
    }
}

Game_MotionSubject.prototype.canUseLMBS = function(obj) {
    var klass = Kien.LMBS_Core.loadMotionDescriptorClass(obj);
    if (klass) {
        return klass.prototype.canUse(this, obj);
    } else {
        return AbstractMotionDescriptor.prototype.canUse(this, obj);
    }
};

Game_MotionSubject.prototype.startDamage = function(obj) {

}

Game_MotionSubject.prototype.clearDamage = function() {

}

Game_MotionSubject.prototype.hasProjectile = function() {
    return this._projectiles.length > 0;
};

Game_MotionSubject.prototype.registProjectile = function(obj) {
    this._projectiles.push(obj);
}

Game_MotionSubject.prototype.shiftProjectile = function() {
    return this._projectiles.shift();
}

Game_MotionSubject.prototype.forceDamage = function(target) {

}

Game_MotionSubject.prototype.forceMoveWith = function(dx) {

}

//-----------------------------------------------------------------------------
// Game_MotionSubject
//
// The game object class for controlling Game_Character object with side scroll
// Action properties;

function Game_SideScrollCharacter() {
    this.initialize.apply(this, arguments);
}

Game_SideScrollCharacter.prototype = Object.create(Game_MotionSubject.prototype);
Game_SideScrollCharacter.prototype.constructor = Game_SideScrollCharacter;

Game_SideScrollCharacter.prototype.initialize = function(subject) {
    this._subject = subject;
    this._lastSubjectX = subject._realX;
    this._lastSubjectY = subject._realY;
    Game_MotionSubject.prototype.initialize.call(this);
}

Game_SideScrollCharacter.prototype.isFalling = function() {

}

Game_SideScrollCharacter.prototype.update = function() {
    this.updateSubjectMovement();
    this.updateGravity();
}

Game_SideScrollCharacter.prototype.updateSubjectMovement = function() {
    if (this._lastSubjectX != this._subject._realX) {
        this._battleX += this._subject._realX - this._lastSubjectX;
        this._lastSubjectX = this._subject._realX;
    }
    if (this._lastSubjectY != this._subject._realY) {
        this._battleY += this._subject._realY - this._lastSubjectY;
        this._lastSubjectY = this._subject._realY;
    }
}

Game_SideScrollCharacter.prototype.battlerName = function() {

}

//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

Kien.SSA.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function() {
    Kien.SSA.Game_Player_initMembers.call(this);
    this._ssaSubject = new Game_SideScrollActor(this);
};

Kien.SSA.Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
    Kien.SSA.Game_Player_update.call(this, sceneActive);
    if ($gameSystem._ssaEnabled) {
        this._ssaSubject.update();
    }
};

Kien.SSA.Game_Player_moveByInput = Game_Player.prototype.moveByInput;
Game_Player.prototype.moveByInput = function() {
    if (!$gameSystem._ssaEnabled) {
        Kien.SSA.Game_Player_moveByInput.call(this);
    }
};

//-----------------------------------------------------------------------------
// Sprite_BattlerLMBS
//
// The superclass of Sprite_ActorLMBS and Sprite_EnemyLMBS.
// Preload all graphics may need in battle for each battler.


function Sprite_BattlerLMBS() {
    this.initialize.apply(this,arguments);
}

Sprite_BattlerLMBS.prototype = Object.create(Sprite_Base.prototype);
Sprite_BattlerLMBS.prototype.constructor = Sprite_BattlerLMBS;

Sprite_BattlerLMBS.prototype.initialize = function(battler){
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers(battler);
}

Sprite_BattlerLMBS.prototype.initMembers = function(battler){
    this._battler = battler;
    if (this._battler){
        this.cacheAllBitmaps(this._battler.battlerName());
    }
    this._pose = "undefined";
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this._damages = [];
    this._projectiles = [];
    this._weaponParentSprite = new Sprite();
    this._weaponSprite = new Sprite_WeaponLMBS(this._weaponParentSprite);
    this.addChild(this._weaponParentSprite);
    this.clearMotion();
}

Sprite_BattlerLMBS.prototype.onStart = function() {
    if (Kien.LMBS_Core.fixCharacterSize) {
        var basewidth = this._cachedBitmaps["Stand"].boxwidth;
        var baseheight = this._cachedBitmaps["Stand"].boxheight;
        for (var i = 0;i < this._cachedBitmapNames.length; i++) {
            var name = this._cachedBitmapNames[i];
            this._cachedBitmaps[name].boxwidth = basewidth;
            this._cachedBitmaps[name].boxheight = baseheight;
        }
    }
}

Sprite_BattlerLMBS.prototype.cacheAllBitmaps = function(baseName){
    var basePath = "img/sv_actors/";
    basePath = basePath.concat(baseName + "/");
    this._cachedBitmaps = {};
    this._cachedBitmapNames = [];
    this._tempBasePath = basePath;
    var names = $dataLMBSCharacters[baseName] || [];
    this.cacheAllBitmapsCallBack(names);
}

Sprite_BattlerLMBS.prototype.cacheAllBitmapsCallBack = function(names){
    for (var i = 0; i < names.length;i++){
        var filename = names[i];
        var arr = filename.match(/(.+?)(?:\[(.*)\])?$/); // ["",name,parameters,""]
        if (arr){
            var cache = this._cachedBitmaps[arr[1]];
            if (!cache) {
                cache = {};
            }
            cache.bitmap = ImageManager.loadNormalBitmap(this._tempBasePath+filename+".png",0);
            if(arr[2] && arr[2].match(/F(\d+)/i)){
                cache.frames = RegExp.$1;
            } else {
                cache.frames = 1;
            }
            cache.parameters = arr.clone();
            cache.bitmap.addLoadListener(function(){
                if (this.json) {
                    this.frames = this.json.frameCount;
                }
                this.height = this.bitmap.height;
                this.width = this.bitmap.width/this.frames;
                if (this.parameters[2] && this.parameters[2].match(/W(\d+)/i)) {
                    this.boxwidth = parseInt(RegExp.$1);
                } else {
                    this.boxwidth = this.width;
                }
                if (this.parameters[2] && this.parameters[2].match(/H(\d+)/i)) {
                    this.boxheight = parseInt(RegExp.$1);
                } else {
                    this.boxheight = this.height;
                }
                if (this.parameters[2] && this.parameters[2].match(/L/i)) {
                    this.loop = true;
                } else {
                    this.loop = false;
                }
            }.bind(cache));
            this._cachedBitmaps[arr[1]] = cache;
            if (!this._cachedBitmapNames.contains(arr[1])) {
                this._cachedBitmapNames.push(arr[1]);
            }
        }

        var posename = filename;
        var cache = this._cachedBitmaps[posename];
        if (!cache) {
            cache = {};
        }
        var xhr = new XMLHttpRequest();
        var url = this._tempBasePath+filename+".json";
        xhr.open('GET', url, false);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                cache.json = JSON.parse(xhr.responseText);
                if (cache.bitmap && cache.bitmap.isReady()) {
                    cache.width = cache.bitmap.width / cache.json.frameCount;
                    cache.frames = cache.frameCount;
                }
            }
        };
        xhr.onerror = function() {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        xhr.send();
        this._cachedBitmaps[posename] = cache;
        if (!this._cachedBitmapNames.contains(posename)) {
            this._cachedBitmapNames.push(posename);
        }
    }
}



Sprite_BattlerLMBS.prototype.currentBitmapCache = function() {
    if (this._cachedBitmaps[this._pose]){
        return this._cachedBitmaps[this._pose];
    } else {
        return {};
    }
}

Sprite_BattlerLMBS.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    if (!SceneManager._scene.isBattlePaused()){
        this.updateBitmap();
        this.updateAnimation();
        this.updateFrame();
        this.updatePosition();
        this.updateDamagePopup();
        this.updateProjectile();
        this.updateTestData();
        this.updateWeaponSprite();
    }
}

Sprite_BattlerLMBS.prototype.updateBitmap = function() {
    if (this._pose != this._battler._pose) {
        this._pose = this._battler._pose;
        if(this._cachedBitmaps[this._pose]){
            this.bitmap = this._cachedBitmaps[this._pose].bitmap;
            this.clearMotion();
        } else {
            if (this._pose == "Stand"){
                throw new Error("You Don't have pose \"Stand\" for your battler: " + this._battler.battlerName());
            }
            this._battler._pose = "Stand";
            this._pose = "undefined";
            this.updateBitmap();
        }
    }
}

Sprite_BattlerLMBS.prototype.getCurrentFrameCount = function() {
    if (this.currentBitmapCache().json) {
        return this.currentBitmapCache().json.frameCount;
    } else {
        return this.currentBitmapCache().frames;
    }
}

Sprite_BattlerLMBS.prototype.getCurrentLoop = function() {
    if (this.currentBitmapCache().json) {
        return this.currentBitmapCache().json.loop;
    } else {
        return this.currentBitmapCache().loop;
    }
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponX = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].weaponX;
    }
    return 0;
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponY = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].weaponY;
    }
    return 0;
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponAngle = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].weaponAngle;
    }
    return 0;
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponHide = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].hideWeapon;
    }
    return false;
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponBack = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].weaponBack;
    }
    return false;
}

Sprite_BattlerLMBS.prototype.getCurrentWeaponMirror = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].weaponMirror;
    }
    return false;
}

Sprite_BattlerLMBS.prototype.getCurrentBoxWidth = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].width;
    } else {
        return this.currentBitmapCache().boxwidth;
    }
}

Sprite_BattlerLMBS.prototype.getCurrentBoxHeight = function() {
    if (this.currentBitmapCache().json) {
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        return this.currentBitmapCache().json.frames[pi].height;
    } else {
        return this.currentBitmapCache().boxheight;
    }
}

Sprite_BattlerLMBS.prototype.updateAnimation = function() {
    if(this.bitmap && this.getCurrentFrameCount() > 1){
        this._animationCount++;
        if(this._animationCount >= this.getCurrentFrameCount() * Kien.LMBS_Core.animationSpeed){
            this._animationCount = this.getCurrentLoop() ? 0 : (this.getCurrentFrameCount() * Kien.LMBS_Core.animationSpeed -1);
        }
    }
    
}

Sprite_BattlerLMBS.prototype.updateFrame = function() {
    if(this.bitmap){
        var fw = this.currentBitmapCache().width
        var pi = this._battler._patternIndex >= 0 ? this._battler._patternIndex : parseInt(this._animationCount / Kien.LMBS_Core.animationSpeed,10);
        if (pi >= this.getCurrentFrameCount()) {
            pi = this.getCurrentFrameCount()-1;
            this._battler._patternIndex = pi;
        }
        var fx = pi * fw;
        this.setFrame(fx,0,fw,this.currentBitmapCache().height);
    }
}

Sprite_BattlerLMBS.prototype.clearMotion = function () {
    this._animationCount = 0;
}

Sprite_BattlerLMBS.prototype.updatePosition = function() {
    this.x = this._battler.screenX();
    this.y = this._battler.screenY();
    if (this.bitmap) {
        this.y -= this.height/2;
    }
    if (this._battler._facing != Kien.LMBS_Core.defaultFacing){
        this.scale.x = -1;
    } else {
        this.scale.x = 1;
    }
    this._battler._battleRect = this.battlerBox();
    this.rotation = this._battler._rotation * Math.PI / 180;
}

Sprite_BattlerLMBS.prototype.battlerBox = function() {
    var rect = new Rectangle(this._battler.screenX(),this._battler.screenY(),0,0);
    if (this.bitmap){
        rect.width = this.getCurrentBoxWidth();
        rect.height = this.getCurrentBoxHeight();
        rect.x -= rect.width/2;
        rect.y -= rect.height;
    }
    return rect;
}

Sprite_BattlerLMBS.prototype.updateDamagePopup = function() {
    this.setupDamagePopup();
    if (this._damages.length > 0) {
        if (!this._damages[0].isPlaying()) {
            this.parent.removeChild(this._damages[0]);
            this._damages.shift();
        }
    }
}

Sprite_BattlerLMBS.prototype.updateProjectile = function() {
    while(this._battler.hasProjectile()){
        var obj = this._battler.shiftProjectile();
        if (eval(obj.classname) === undefined) {
            continue;
        }
        var sprite = new (eval(obj.classname))(obj.parameters, this);
        var updateFunc = sprite.update;
        var newUpdateFunc = function() {
            if (!SceneManager._scene.isBattlePaused()){
                updateFunc.call(this);
            }
        }
        sprite.update = newUpdateFunc;
        this._projectiles.push(sprite);
        this.parent.addChild(sprite);
    }
    var func = function(sprite){
        return sprite._finish;
    };
    var i = this._projectiles.findIndex(func);
    while(i >= 0){
        var sprite = this._projectiles.splice(i,1)[0];
        sprite.removeLMBS();
        this.parent.removeChild(sprite);
        i = this._projectiles.findIndex(func);
    }
}

Sprite_BattlerLMBS.prototype.updateTestData = function() {
    if(Kien.LMBS_Core.isTest() && SceneManager._scene._testBitmap){
        var rect = this.battlerBox();
        var color = "rgba(0,0,255,0.5)";
        SceneManager._scene._testBitmap.fillRect(rect.x,rect.y,rect.width,rect.height,color);
        if(this._battler.isDamaging()){
            var nrect = this._battler._damageInfo.rect;
            var arect = new Rectangle(nrect.x,nrect.y,nrect.width,nrect.height);
            if(this._battler._facing){
                arect.x += this._battler.screenX();
            } else {
                arect.x = this._battler.screenX() - arect.x;
                arect.x -= arect.width;
            }
            arect.y += this._battler.screenY() - arect.height;
            color = "rgba(255,0,0,0.5)";
            if (this._battler._waitInput){
                color = "rgba(255,0,255,0.5)";
            }
            SceneManager._scene._testBitmap.fillRect(arect.x,arect.y,arect.width,arect.height,color);
        }
        var rects = this._battler._debugRects;
        for (var i = 0; i < rects.length; i++) {
            rect = rects[i];
            color = "rgba(128,128,128,0.5)";
            SceneManager._scene._testBitmap.fillRect(rect.x,rect.y,rect.width,rect.height,color);
        }
    }
}

Sprite_BattlerLMBS.prototype.updateWeaponSprite = function() {
    if (this._battler.getWeaponName() != this._weaponSprite._name) {
        this._weaponSprite.setup(this._battler.getWeaponName());
    }
    this._weaponParentSprite.x = this.getCurrentWeaponX() ? this.getCurrentWeaponX() : 0;
    this._weaponParentSprite.y = this.getCurrentWeaponY() ? this.getCurrentWeaponY() : 0;
    this._weaponSprite._hide = this.getCurrentWeaponHide();
    this._weaponSprite._angle = this.getCurrentWeaponAngle() ? this.getCurrentWeaponAngle() : 0;
    this._weaponParentSprite.scale.x = this.getCurrentWeaponMirror() ? -1 : 1;
    this._weaponSprite.update();
}

Sprite_BattlerLMBS.prototype.setupDamagePopup = function() {
    if (this._battler.isDamagePopupRequested()) {
        var sprite = new Sprite_Damage();
        sprite.x = this.x + this.damageOffsetX();
        sprite.y = this.y + this.damageOffsetY();
        sprite.setup(this._battler);
        var updateFunc = sprite.update;
        var newUpdateFunc = function() {
            if (!SceneManager._scene.isBattlePaused()){
                updateFunc.call(this);
                // Call twice to speed up the effect
                updateFunc.call(this);
            }
        }
        sprite.update = newUpdateFunc;
        this._damages.push(sprite);
        this.parent.addChild(sprite);
        this._battler.clearDamagePopup();
        this._battler.clearResult();
    }
};

Sprite_BattlerLMBS.prototype.damageOffsetX = function() {
    return Kien.LMBS_Core.damageOffsetX;
}

Sprite_BattlerLMBS.prototype.damageOffsetY = function() {
    return Kien.LMBS_Core.damageOffsetY;
}

Sprite_BattlerLMBS.prototype.oppositeMembers = function() {
     var spriteset = this.parent;
     return this._battler.isActor() ? spriteset._Enemies : spriteset._Actors;
}

Sprite_BattlerLMBS.prototype.targetSprite = function() {
    if(!this._battler._target){
        return null;
    }
    return this.parent.findSprite(this._battler._target);
}

Sprite_BattlerLMBS.prototype.renderWebGL = function (renderer)
{

    // if the object is not visible or the alpha is 0 then no need to render this element
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable)
    {

        return;
    }

    var i, j;

    // do a quick check to see if this element has a mask or a filter.
    if (this._mask || this._filters)
    {
        renderer.currentRenderer.flush();

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if (this._filters && this._filters.length)
        {
            renderer.filterManager.pushFilter(this, this._filters);
        }

        if (this._mask)
        {
            renderer.maskManager.pushMask(this, this._mask);
        }

        renderer.currentRenderer.start();

        // Render children first if this.getCurrentWeaponBack returns true.
        if (this.getCurrentWeaponBack()) {
            for (i = 0, j = this.children.length; i < j; i++)
            {
                this.children[i].renderWebGL(renderer);
            }
            this._renderWebGL(renderer);
        } else {
            // add this object to the batch, only rendered if it has a texture.
            this._renderWebGL(renderer);

            // now loop through the children and make sure they get rendered
            for (i = 0, j = this.children.length; i < j; i++)
            {
                this.children[i].renderWebGL(renderer);
            }

        }
        renderer.currentRenderer.flush();

        if (this._mask)
        {
            renderer.maskManager.popMask(this, this._mask);
        }

        if (this._filters)
        {
            renderer.filterManager.popFilter();

        }
        renderer.currentRenderer.start();
    }
    else
    {
        if (this.getCurrentWeaponBack()) {
            // simple render children!
            for (i = 0, j = this.children.length; i < j; ++i)
            {
                this.children[i].renderWebGL(renderer);
            }
            this._renderWebGL(renderer);

        } else {
            this._renderWebGL(renderer);

            // simple render children!
            for (i = 0, j = this.children.length; i < j; ++i)
            {
                this.children[i].renderWebGL(renderer);
            }
        }
    }
};

/**
 * Renders the object using the Canvas renderer
 *
 * @param renderer {PIXI.CanvasRenderer} The renderer
 */
 Sprite_BattlerLMBS.prototype.renderCanvas = function (renderer)
 {
    // if not visible or the alpha is 0 then no need to render this
    if (!this.visible || this.alpha <= 0 || !this.renderable)
    {
        return;
    }

    if (this._mask)
    {
        renderer.maskManager.pushMask(this._mask);
    }
    if (this.getCurrentWeaponBack()) {
        for (var i = 0, j = this.children.length; i < j; ++i)
        {
            this.children[i].renderCanvas(renderer);
        }
        this._renderCanvas(renderer);
    } else {
        this._renderCanvas(renderer);
        for (var i = 0, j = this.children.length; i < j; ++i)
        {
            this.children[i].renderCanvas(renderer);
        }
    }
    if (this._mask)
    {
        renderer.maskManager.popMask(renderer);
    }
};
//-----------------------------------------------------------------------------
// Sprite_ActorLMBS
//
// Add some Player specified methods, such as collapse effect.

function Sprite_ActorLMBS() {
    this.initialize.apply(this, arguments);
}

Sprite_ActorLMBS.prototype = Object.create(Sprite_BattlerLMBS.prototype);
Sprite_ActorLMBS.prototype.constructor = Sprite_ActorLMBS;

Sprite_ActorLMBS.prototype.initialize = function(battler){
    Sprite_BattlerLMBS.prototype.initialize.call(this,battler);
}

//-----------------------------------------------------------------------------
// Sprite_EnemyLMBS
//
// Add some Enemy specified methods, such as collapse effect.

function Sprite_EnemyLMBS() {
    this.initialize.apply(this, arguments);
}



Sprite_EnemyLMBS.prototype = Object.create(Sprite_BattlerLMBS.prototype);
Sprite_EnemyLMBS.prototype.constructor = Sprite_EnemyLMBS;

Sprite_EnemyLMBS.prototype.initialize = function(battler){
    Sprite_BattlerLMBS.prototype.initialize.call(this,battler);
}

Sprite_EnemyLMBS.prototype.initMembers = function(battler) {
    Sprite_BattlerLMBS.prototype.initMembers.call(this,battler);
    this._effectDuration = 0;
    this._collapsed = false;
}

Sprite_EnemyLMBS.prototype.update = function() {
    Sprite_BattlerLMBS.prototype.update.call(this);
    this.updateCollapseEffect();
}

Sprite_EnemyLMBS.prototype.updateCollapseEffect = function() {
    if(!this._collapsed && this._battler.isDead()){
        this._collapsed = true;
        this._effectDuration = 32;
    }
    if (this._collapsed && this._effectDuration > 0){
        this._effectDuration--;
        this.updateCollapse();
        if(this._effectDuration == 0){
            this.visible = false;
        }
    }
}

Sprite_EnemyLMBS.prototype.updateCollapse = function() {
    this.blendMode = Graphics.BLEND_ADD;
    this.setBlendColor([255, 128, 128, 128]);
    this.opacity *= this._effectDuration / (this._effectDuration + 1);
};

//-----------------------------------------------------------------------------
// Sprite_WeaponLMBS
//
// use to show weapon image. Properties should be set correctly by battler sprite.

function Sprite_WeaponLMBS() {
    this.initialize.apply(this, arguments);
}

Sprite_WeaponLMBS.prototype = Object.create(Sprite_Base.prototype);
Sprite_WeaponLMBS.prototype.constructor = Sprite_WeaponLMBS;

Sprite_WeaponLMBS.caches = {};

Sprite_WeaponLMBS.prototype.initialize = function(parentSprite){
    Sprite_Base.prototype.initialize.call(this);
    parentSprite.addChild(this);
    this._angle = 0;
    this._hide = false;
    this._prop = null;
    this._name = "";
}

Sprite_WeaponLMBS.prototype.setup = function(filename) {
    this._name = filename;
    if (filename.length === 0) {
        this.bitmap = null;
        this._prop = null;
        return;
    }
    this.bitmap = ImageManager.loadWeapon(filename);
    this._prop = Sprite_WeaponLMBS.caches[filename];
    if (!this._prop) {
        var xhr = new XMLHttpRequest();
        var url = 'img/weapons/'+filename+'.json';
        xhr.open('GET', url, false);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                this._prop = JSON.parse(xhr.responseText);
                this.onLoadFinish();
            }
        }.bind(this);
        xhr.onerror = function() {
            this._prop = {};
            this._prop.ox = 0;
            this._prop.oy = 0;
            this._prop.angle = 0;
            this.onLoadFinish();
        }.bind(this);
        xhr.send();
    } else {
        this.onLoadFinish();
    }
}

Sprite_WeaponLMBS.prototype.update = function() {
    if (this._prop) {
        this.updateAngle();
        this.updateVisible();
        this.updateAnchor();
    }
}

Sprite_WeaponLMBS.prototype.updateAngle = function() {
    this.rotation = ((((this._prop.angle + this._angle ) % 360) + 360) % 360) * Math.PI / 180;
}

Sprite_WeaponLMBS.prototype.updateVisible = function() {
    this.visible = !this._hide;
}

Sprite_WeaponLMBS.prototype.updateAnchor = function() {
    this.anchor.x = 0.5 + this._prop.ox / this.bitmap.width;
    this.anchor.y = 0.5 + this._prop.oy / this.bitmap.height;
}

Sprite_WeaponLMBS.prototype.onLoadFinish = function() {
    Sprite_WeaponLMBS.caches[this._name] = this._prop;
}

if (Sprite_ProjectileLMBS === undefined) {
//-----------------------------------------------------------------------------
// Sprite_ProjectileLMBS
//
// Basic Projectile class.

function Sprite_ProjectileLMBS() {
    this.initialize.apply(this, arguments);
}

Sprite_ProjectileLMBS.prototype = Object.create(Sprite_Base.prototype);
Sprite_ProjectileLMBS.prototype.constructor = Sprite_ProjectileLMBS;

Sprite_ProjectileLMBS.prototype.initialize = function(parameters, sprite){
    Sprite_Base.prototype.initialize.call(this);
    if(parameters.match(/(.+)\,(\d+)\,(\d+)\,([+-]?\d+)\,([+-]?\d+)\,(\d+(?:\.\d+)?)\,(\d+)\,(\d+)\,(\d+)/)){
        var filename = RegExp.$1;
        var framenumber = parseInt(RegExp.$2);
        var animationSpeed = parseInt(RegExp.$3);
        var xspeed = parseInt(RegExp.$4);
        var yspeed = parseInt(RegExp.$5);
        var damagePer = parseFloat(RegExp.$6);
        var knockbackx = parseInt(RegExp.$7);
        var knockbacky = parseInt(RegExp.$8);
        var knockbackdir = parseInt(RegExp.$9);
    }
    this._xspeed = xspeed || 3;
    this._yspeed = yspeed || 0;
    this._damagePer = damagePer || 1;
    this._frameNumber = framenumber || 1;
    this._animationSpeed = animationSpeed || 1;
    this._bitmapName = filename || "";
    this._knockbackx = knockbackx || 5;
    this._knockbacky = knockbacky || 5;
    this._knockbackdir = knockbackdir || 0;
    this._direction = 0;
    this._finish = false;
    this._animationCount = 0;
    this._hit = false;
    this.visible = false;
    this.updateBitmap();
    this.x = sprite._battler.screenX();
    this.y = sprite._battler.screenY();
    this._userSprite = sprite;
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this.visible = true;
    this._battler = sprite._battler;
    this._direction = (this._battler._facing ? 1 : -1);
    this.scale.x = this._direction * (Kien.LMBS_Core.defaultFacing ? 1 : -1);
    this._action = new Game_Action(this._battler);
    this._action.setSkill(this._battler._actions[0].item().id);
    this._action._damagePercentage = this._damagePer;
}

Sprite_ProjectileLMBS.prototype.updateBitmap = function() {
    if(!this.bimtap){
        this.bitmap = ImageManager.loadProjectile(this._bitmapName);
    }
}

Sprite_ProjectileLMBS.prototype.removeLMBS = function() {

}

Sprite_ProjectileLMBS.prototype.update = function() {
    if (!this._finish){
        this.updatePosition();
        this.updateAnimation();
        this.updateDamage();
        this.updateTestData();
    }
}

Sprite_ProjectileLMBS.prototype.updatePosition = function() {
    if (this._direction != 0){
        this.x += this._xspeed * this._direction;
        this.y -= this._yspeed; 
        if(this.outOfBound()){
            this.visible = false;
            this._finish = true;
        }
    }
}

Sprite_ProjectileLMBS.prototype.updateAnimation = function() {
    this._animationCount++;
    if(this._animationCount > this._animationSpeed*this._frameNumber){
        this._animationCount = 0;
    }
    var fn = this._frameNumber;
    var pn = Math.floor(this._animationCount / this._animationSpeed);
    var pw = Math.floor(this.bitmap.width / fn);
    var px = pw * pn;
    this.setFrame(px,0,pw,this.bitmap.height);
}

Sprite_ProjectileLMBS.prototype.updateDamage = function() {
    if (this._userSprite){
        var rect = this.boundRect();
        var memb = this._userSprite.oppositeMembers();
        memb.forEach(function(enemy){
            if(!enemy._battler.isDead() && enemy.battlerBox().overlap(rect) && !this._hit){
                this._action.apply(enemy._battler);
                var dir = this._knockbackdir ? ( 5 - this._direction ) : ( 5 + this._direction );
                enemy._battler.knockback({"x": this._knockbackx, "y": this._knockbacky},dir);
                enemy._battler.endMotion();
                enemy._battler.startDamagePopup();
                this._hit = true;
            }
        }, this);
        if(this._hit){
            this.visible = false;
            this._finish = true;
        }
    }
}

Sprite_ProjectileLMBS.prototype.updateTestData = function() {
    if(Kien.LMBS_Core.isTest() && SceneManager._scene._testBitmap){
        var rect = this.boundRect();
        var color = "rgba(0,255,0,0.5)";
        SceneManager._scene._testBitmap.fillRect(rect.x,rect.y,rect.width,rect.height,color);
    }
}

Sprite_ProjectileLMBS.prototype.boundRect = function() {
    return new Rectangle(this.x-this.width/2,this.y-this.height,this.width,this.height);
}

Sprite_ProjectileLMBS.prototype.outOfBound = function() {
    return (this.x < 0 || this.x > Kien.LMBS_Core.battleWidth || this.y < 0 || this.y > Graphics.height);
}

}

if (Sprite_Animation === undefined) {

//-----------------------------------------------------------------------------
// Sprite_AnimationLMBS
//
// The sprite for displaying an animation.
// Extends from Sprite_Animation, with ability to load json timing and
// process it.
function Sprite_AnimationLMBS() {
    this.initialize.apply(this, arguments);
}

Sprite_AnimationLMBS.prototype = Object.create(Sprite_Animation.prototype);
Sprite_AnimationLMBS.prototype.constructor = Sprite_AnimationLMBS;

Sprite_AnimationLMBS.prototype.initialize = function(parameters, sprite){
    Sprite_Animation.prototype.initialize.call(this);
    //                    origin,    dx,         dy,    jsoname   id,  delay,      mirror,          follow
    if (parameters.match(/(.+?)\,([+-]?\d+)\,([+-]?\d+)\,(.+?)\,(\d+)\,(\d+)\,(true|false|null)\,(true|false)/)){
        var origin = RegExp.$1;
        var dx = parseInt(RegExp.$2,10);
        var dy = parseInt(RegExp.$3,10);
        var filename = RegExp.$4;
        var obj = Kien.LMBS_Core.createAnimationTimingFromName(filename);
        var animationId = parseInt(RegExp.$5,10);
        var delay = parseInt(RegExp.$6,10);
        var mirror = eval(RegExp.$7);
        var follow = eval(RegExp.$8);
    }
    this._timingArray = obj || {};
    this._originName = origin || "target";
    this._dx = dx || 0;
    this._dy = dy || 0;
    this._animation = $dataAnimations[animationId] || null;
    this._delay = delay || 0;
    this._mirror = mirror
    this._follow = follow || false;
    this._targetSprite = null;
    this._finish = false;
    this._userSprite = sprite;
    this._battler = sprite._battler;
    this._targetSprite =  sprite.targetSprite();
    this._animationPosition = {
        "x" : this.animationX(),
        "y" : this.animationY(),
        "height" : this._targetSprite.height
    }
    this._action = new Game_Action(this._battler);
    this._action.setSkill(this._battler._actions[0].item().id);
    if (this._mirror === null) {
        this._mirror = !this._battler._facing;
    }
    if(this._targetSprite && this._animation){
        if (this._mirror){
           this.scale.x = -1;
        }
        this.setup(this._targetSprite , this._animation, this._mirror, this._delay);
    } else {
        this._finish = true;
    }
}

Sprite_AnimationLMBS.prototype.updateCellSprite = function(sprite, cell) {
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

Sprite_AnimationLMBS.prototype.initMembers = function() {
    Sprite_Animation.prototype.initMembers.call(this);
    this._timingArray = {};
    this._processingTiming = [];
}


Sprite_AnimationLMBS.prototype.animationX = function() {
    switch (this._originName) {
        case "target":
            return (this._targetSprite._battler.screenX() + this._dx);
        case "user":
            return (this._userSprite._battler.screenX() + this._dx);
        case "screen":
            return (this._dx);
    }
    return 0;
}

Sprite_AnimationLMBS.prototype.animationY = function() {
    switch (this._originName) {
        case "target":
            return (this._targetSprite._battler.screenY() + this._dy);
        case "user":
            return (this._userSprite._battler.screenY() + this._dy);
        case "screen":
            return (this._dy);
    }
    return 0;
}

Sprite_AnimationLMBS.prototype.removeLMBS = function() {
    this.remove();
}


Sprite_AnimationLMBS.prototype.updateMain = function() {
    Sprite_Animation.prototype.updateMain.call(this);
    this.updateTestData();
    if (this.isPlaying() && this.isReady() && this._delay == 0) {
        this.updateDamage();
    }
    if(!this.isPlaying()){
        this._finish = true;
    }
}

Sprite_AnimationLMBS.prototype.updateTestData = function() {
    if(Kien.LMBS_Core.isTest() && SceneManager._scene._testBitmap){
        var color = "rgba(0,255,0,0.5)";
        for (var i = 0; i < this._processingTiming.length; i++) {
            var obj = this._processingTiming[i];
            var rectsource = obj.rect;
            var rect = new Rectangle(rectsource.x,rectsource.y,rectsource.width,rectsource.height);
            rect.x += this.x;
            rect.y += this.y;
            SceneManager._scene._testBitmap.fillRect(rect.x,rect.y,rect.width,rect.height,color);
        }
    }
}

Sprite_AnimationLMBS.prototype.updateDamage = function() {
    var memb = this._userSprite.oppositeMembers();
    var func = function(enemy){
        if(!enemy._battler.isDead() && enemy.battlerBox().overlap(rect) && obj.hitted.indexOf(enemy) == -1){
            this._action.apply(enemy._battler);
            var dir = obj.knockdir ? (this._battler._facing ? 4 : 6) : (this._battler._facing ? 6 : 4);
            enemy._battler.knockback(obj.knockback,dir);
            enemy._battler.endMotion();
            enemy._battler.startDamagePopup();
            BattleManager.refreshStatus();
            obj.hitted.push(enemy);
        }
    };
    for (var i = 0; i < this._processingTiming.length; i++) {
        var obj = this._processingTiming[i];
        var rectsource = obj.rect;
        this._action._damagePercentage = obj.damagePer;
        var rect = new Rectangle(rectsource.x,rectsource.y,rectsource.width,rectsource.height);
        rect.x += this.x;
        rect.y += this.y;
        memb.forEach(func, this);
    }
}

Sprite_AnimationLMBS.prototype.updatePosition = function() {
    Sprite_Animation.prototype.updatePosition.call(this);
    if (this._follow) {
        this._animationPosition.x = this.animationX();
        this._animationPosition.y = this.animationY();
    }
    this.x = this._animationPosition.x;
    this.y = this._animationPosition.y;
    if (this._animation.position == 0){
        this.y -= this._animationPosition.height;
    }
    if (this._animation.position == 1){
        this.y -= this._animationPosition.height/2
    }

};

Sprite_AnimationLMBS.prototype.updateFrame = function() {
    Sprite_Animation.prototype.updateFrame.call(this);
    if (this._duration > 0) {
        this.updateTiming();
        this.updateProcessingTiming();
    }
}

Sprite_AnimationLMBS.prototype.updateTiming = function() {
    var index = this.currentFrameIndex().toString();
    if(this._timingArray[index]){
        var array = this._timingArray[index];
        for (var i = 0; i < array.length;i++){
            var obj = Object.create(array[i]);
            obj.hitted = [];
            if (obj.knockdir == 0){
                obj.knockdir = this._battler._facing ? 6 : 4;
            }
            this._processingTiming.push(obj);
        }
    }
}

Sprite_AnimationLMBS.prototype.updateProcessingTiming = function() {
    for (var i = 0; i<this._processingTiming.length; i++) {
        this._processingTiming[i].dur--;
    }
    var func = function(obj) {
        return obj.dur == 0;
    };
    var index = this._processingTiming.findIndex(func)
    while(index >= 0){
        this._processingTiming.splice(index,1);
        index = this._processingTiming.findIndex(func);
    }
}

}
