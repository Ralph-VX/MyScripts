//=============================================================================
// Shooting RPG System
// ShootingRPG.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_MagicTower = true;

var Kien = Kien || {};
Kien.ShootingRPG = {};
//=============================================================================
/*:
 * @plugindesc A system allow battle become Shooting. Can be on/off.
 * @author Kien
 *
 * @param Enabled Default
 * @desc Enable the system by default.
 * @default false
 *
 * @param Player Bound Width
 * @desc the width of the player in tile.
 * @default 0.1
 *
 * @param Player Bound Height
 * @desc the width of the player in tile.
 * @default 0.1
 *
 * @param Battle Map ID
 * @desc Default Map id of the map used as battle field.
 * @default 0
 *
 * @param Battle End Switch ID
 * @desc Switch Id for the battle end event switch. 0 to disable.
 * @default 0
 *
 * @param Battle Result Variable ID
 * @desc Variable Id for retrive the result of battle. 0 to disable.
 * in variable: 0 - Victory, 1 - Aborted(or Escaped), 2 - Defeated.
 * @default 0
 *
 * @param Turn Length
 * @desc length in frames of a turn is.
 * @default 600
 *
 * @param Debug Mode
 * @desc show the rects to represents collision rect.
 * @default false
 *
 * @param Single Frame Per Render
 * @desc only allow one processing frame per render process. 
 * @default true
 *
 * @param Show Score
 * @desc show the score in battle screen.
 * @default true
 *
 * @param Auto Fire
 * @desc Player will automatically attack without holding button.
 * @default true
 *
 * @noteParam ShootingProjectileImage
 * @noteRequire 1
 * @noteDir img/system/
 * @noteType file
 * @noteData enemies
 
 * @noteParam ShootingProjectileImage
 * @noteRequrie 1
 * @noteDir img/system/
 * @noteType file
 * @noteData weapons

 * @noteParam ShootingProjectileImage
 * @noteRequrie 1
 * @noteDir img/system/
 * @noteType file
 * @noteData actors

 * @requiredAssets img/system/Shot
 * @requiredAssets img/system/hpGauge
 *
 * @help
 * <ShootingProjectileImage:filename>: set the default filename of the shot. Can set on Enemy, Actor and Weapon.
 * <ShootingAi:funcName>: set the ai function to funcName, or it will be "aiFunc" + enemyId;
 * <ShootingAiInit:funcName>: set the ai initialization function to funcName, or it will not be initialized (do it inside your function).
 * <AttackFunc:funcName>: set the attack function of player/weapon.
 * 
*/

Kien.ShootingRPG.parameters = PluginManager.parameters("ShootingRPG");
Kien.ShootingRPG.enableDefault = eval(Kien.ShootingRPG.parameters["Enabled Default"]);
Kien.ShootingRPG.playerWidth = parseFloat(Kien.ShootingRPG.parameters["Player Bound Width"], 10);
Kien.ShootingRPG.playerHeight = parseFloat(Kien.ShootingRPG.parameters["Player Bound Height"], 10);
Kien.ShootingRPG.battleMapId = parseInt(Kien.ShootingRPG.parameters["Battle Map ID"], 10);
Kien.ShootingRPG.battleEndSwitchId = parseInt(Kien.ShootingRPG.parameters["Battle End Switch ID"], 10);
Kien.ShootingRPG.battleResultVariableId = parseInt(Kien.ShootingRPG.parameters["Battle Result Variable ID"], 10);
Kien.ShootingRPG.turnLength = parseInt(Kien.ShootingRPG.parameters["Turn Length"], 10);
Kien.ShootingRPG.debugMode = eval(Kien.ShootingRPG.parameters["Debug Mode"]);
Kien.ShootingRPG.limitProcess = eval(Kien.ShootingRPG.parameters["Single Frame Per Render"]);
Kien.ShootingRPG.showScore = eval(Kien.ShootingRPG.parameters["Show Score"]);
Kien.ShootingRPG.autoFire = eval(Kien.ShootingRPG.parameters["Auto Fire"]);


if (Kien.ShootingRPG.battleMapId === 0) {
    throw new Error("Invalid Plugin Parameter: \"Battle Map ID\", you must change this value from 0.");
}

if (!Imported.Kien_Lib) {
    throw new Error("No Library Found.\n Please put KienLib.js above this plugin.");
}


DataManager._reservedMap = null;

Kien.ShootingRPG.DataManager_isMapLoaded = DataManager.isMapLoaded;
DataManager.isMapLoaded = function() {
    return Kien.ShootingRPG.DataManager_isMapLoaded.call(this) && !(DataManager._reservedMap !== null && DataManager._reservedMap == $dataMap );
};

//-----------------------------------------------------------------------------
// SceneManager
//
// The static class that manages scene transitions.

Kien.ShootingRPG.SceneManager_isNextScene = SceneManager.isNextScene;
SceneManager.isNextScene = function(sceneClass) {
    if (sceneClass === Scene_Battle) {
        return Kien.ShootingRPG.SceneManager_isNextScene.call(this, Scene_BattleShooting) || Kien.ShootingRPG.SceneManager_isNextScene.call(this, sceneClass);
    };
    return Kien.ShootingRPG.SceneManager_isNextScene.call(this, sceneClass);
};

SceneManager.updateMain = function() {
    if (Utils.isMobileSafari()) {
        this.changeScene();
        this.updateScene();
    } else {
        var newTime = this._getTimeInMs();
        var fTime = (newTime - this._currentTime) / 1000;
        if (fTime > 0.25) fTime = 0.25;
        this._currentTime = newTime;
        this._accumulator += fTime;
        if (Kien.ShootingRPG.limitProcess) {
            if (this._accumulator >= this._deltaTime) {
                this.updateInputData();
                this.changeScene();
                this.updateScene();
                this._accumulator -= this._deltaTime;
            }
        } else {
            while (this._accumulator >= this._deltaTime) {
                this.updateInputData();
                this.changeScene();
                this.updateScene();
                this._accumulator -= this._deltaTime;
            }
        }
    }
    this.renderScene();
    this.requestUpdate();
};

//-----------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.

Kien.ShootingRPG.BattleManager_setup = BattleManager.setup;
BattleManager.setup = function(troopId, canEscape, canLose) {
	Kien.ShootingRPG.BattleManager_setup.apply(this, arguments);
	if ($gameSystem._shootingRPGEnabled) {
        if (!this._shootingPlayer) {
            this._shootingPlayer = new Game_Player();
            this._shootingPlayer._direction = 8;
            this._shootingPlayer._directionFix = true;
            this._shootingPlayer.setTransparent(false);
            this._shootingPlayer.isDashing = function() {return true};
        }
        if (!this._shootingMap) {
            this._shootingMap = new Game_Map();
        }
        this._shootingPlayer.refresh();
        this._lastPixelMoveEnable = $gameSystem._pixelMoveEnabled;
        $gameSystem._pixelMoveEnabled = true;
        DataManager._reservedGameMap = $gameMap;
        DataManager._reservedGamePlayer = $gamePlayer;
        DataManager._reservedMap = $dataMap;
		DataManager.loadMapData($gameSystem._shootingRPGBattleMapId);
        $dataMap = DataManager._reservedMap;
	}
};

BattleManager.createBattlers = function() {
    this.enemies = [];
    this._shootingMap.events().filter(function(e) {
        return !!e.event().meta["EnemyIndex"];
    }).forEach(function(e) {
        this.enemies.push(new Game_ShootingEnemy(e));
    }.bind(this));
    var callback = function(e) {
        return e._enemy === null;
    }
    var i = this.enemies.findIndex(callback);
    while (i != -1) {
        this.enemies.splice(i, 1);
        i = this.enemies.findIndex(callback);
    }
    this.player = new Game_ShootingPlayer();
    var pe = this._shootingMap.events().find(function(e) {
        return !!e.event().meta["PlayerPosition"];
    });
    if (!!pe){
        pe._through = true;
        $gamePlayer.copyPosition(pe);
        $gamePlayer._direction = 8;
        $gamePlayer._directionFix = true;
    }
    this.extra = new Game_ShootingCharacter();
    this.subEnemies = [];
}

BattleManager.revertGameObject = function() {
    DataManager._reservedMap = null;
    $gameMap._interpreter.clear();
    $gameMap = DataManager._reservedGameMap;
    $gamePlayer = DataManager._reservedGamePlayer;
    $gameSystem._pixelMoveEnabled = this._lastPixelMoveEnable;
}

Kien.ShootingRPG.BattleManager_isBusy = BattleManager.isBusy;
BattleManager.isBusy = function() {
    if ($gameSystem._shootingRPGEnabled) {
        return $gameMessage.isBusy();
    } else {
        return Kien.ShootingRPG.BattleManager_isBusy.call(this);
    }
};

Kien.ShootingRPG.BattleManager_update = BattleManager.update;
BattleManager.update = function() {
    if ($gameSystem._shootingRPGEnabled) {
        if (!this.isBusy() && !this.updateEvent() && !$gameMap.isEventRunning()) {
            $gameSystem._shootingRPGNearmiss = false;
            this._shootingMap.update(SceneManager._scene.isActive());
            this.updateBattler();
			this._turnCount++;
			if (this._turnCount >= $gameSystem._shootingRPGTurnLength) {
                this._turnCount = 0;
                this.endTurn();
            }
            if (this.isBattleEnd()) {
                if ($gameSystem._shootingRPGBattleEndSwitchId > 0) {
                    if (this._battleEnded && !$gameSwitches.value($gameSystem._shootingRPGBattleEndSwitchId)) {
                        this.updateBattleEnd()
                    } else {
                        $gameSwitches.setValue($gameSystem._shootingRPGBattleEndSwitchId, true);
                        this._battleEnded = true;
                    }
                } else {
                    this.updateBattleEnd();
                }
            }
		} 
    }else {
		Kien.ShootingRPG.BattleManager_update.call(this);
	}
};

BattleManager.updateBattler = function() {
    this.player.update();
    this.enemies.forEach(function(b){
        b.update();
    });
    this.subEnemies.forEach(function(b){
        b.update();
    });
    this.extra.update();
    this.player.checkCollision();
    this.enemies.forEach(function(b){
        b.checkCollision();
    });
    this.subEnemies.forEach(function(b){
        b.checkCollision();
    });
    this.extra.checkCollision();
    this.reportProjectiles();
}

BattleManager.reportProjectiles = function() {
    if (Kien.ShootingRPG.debugMode) {
        var sum = this.playerProjectiles();
        sum += this.enemyProjectiles();
        sum += this.extraProjectiles();
        console.log(sum, Math.round(Graphics._fpsMeter.fps));
    }
}

BattleManager.playerProjectiles = function() {
    var sum = 0;
    sum += this.player._projectiles.length;
    return sum;
}

BattleManager.enemyProjectiles = function() {
    var sum = 0;
    for (var n = 0; n <this.enemies.length; n++) {
        sum += this.enemies[n]._projectiles.length;
    }
    for (var n = 0; n <this.subEnemies.length; n++) {
        sum += this.subEnemies[n]._projectiles.length;
    }
    return sum;
}

BattleManager.extraProjectiles = function() {
    var sum = 0;
    sum += this.extra._projectiles.length;
    return sum;
}

Kien.ShootingRPG.BattleManager_endTurn = BattleManager.endTurn;
BattleManager.endTurn = function() {
    if ($gameSystem._shootingRPGEnabled) {
        this.allBattleMembers().forEach(function(battler) {
            battler.onTurnEnd();
        }, this);
    } else {
        Kien.ShootingRPG.BattleManager_endTurn.call(this);
    }
};

Kien.ShootingRPG.BattleManager_startBattle = BattleManager.startBattle;
BattleManager.startBattle = function() {
    if ($gameSystem._shootingRPGEnabled) { 
        this._phase = 'start';
        this._turnCount = 0;
        this._battleEnded = false;
        if ($gameSystem._shootingRPGBattleEndSwitchId > 0) {
            $gameSwitches.setValue($gameSystem._shootingRPGBattleEndSwitchId, false);
        }
        $gameSystem.onBattleStart();
        $gameParty.onBattleStart();
        $gameTroop.onBattleStart();
    } else {
        Kien.ShootingRPG.BattleManager_startBattle.apply(this, arguments);
    }
};

Kien.ShootingRPG.BattleManager_endBattle = BattleManager.endBattle;
BattleManager.endBattle = function(result) {
    Kien.ShootingRPG.BattleManager_endBattle.call(this, result);
    if ($gameSystem._shootingRPGBattleResultVariableId > 0) {
        $gameVariables.setValue($gameSystem._shootingRPGBattleResultVariableId, result);
    }
};

BattleManager.getBattlerFromEvent = function(e) {
    if (e === $gamePlayer) {
        return this.player;
    } else {
        var e2 = this.enemies.find(function(be) {
            return be._character == e;
        })
        if (!!e2) {
            return e2;
        } else {
        }
    }
}

BattleManager.getSubenemyFromEvent = function(e) {
    var e2 = this.subEnemies.find(function(be){
        return be._src == e;
    });
    if (!!e2) {
        return e2;
    } else {
        return null;
    }
}
BattleManager.playerMember = function() {
    return [this.player].concat(this.subEnemies.filter(function(se){return se._isActor}));
}

BattleManager.enemyMember = function() {
    return this.enemies.concat(this.subEnemies.filter(function(se){return !se._isActor}));
}

BattleManager.playerHp = function() {
    return $gameParty.leader().hp;
}

BattleManager.enemyHp = function() {
    var sum = 0;
    for (var n = 0; n < $gameTroop.members().length; n++) {
        sum += $gameTroop.members()[n].hp;
    }
    return sum;
}

BattleManager.addSubEnemy = function(obj) {
    this.removeSubEnemy(obj);
    this.subEnemies.push(new Game_ShootingSubEnemy(obj));
}

BattleManager.removeSubEnemy = function(obj) {
    if (!!obj.src) {
        obj = obj.src;
    }
    var i = this.subEnemies.findIndex(function(o) {return o._src == obj});
    if (i >= 0) {
        this.subEnemies.splice(i,1);
    }
}

BattleManager.processVictory = function() {
    $gameParty.removeBattleStates();
    $gameParty.performVictory();
    //this.playVictoryMe();
    this.replayBgmAndBgs();
    this.makeRewards();
    this.displayVictoryMessage();
    this.displayRewards();
    this.gainRewards();
    this.endBattle(0);
};

BattleManager.displayVictoryMessage = function() {
    //$gameMessage.add(TextManager.victory.format($gameParty.name()));
};

BattleManager.displayDefeatMessage = function() {
    //$gameMessage.add(TextManager.defeat.format($gameParty.name()));
};

BattleManager.displayEscapeSuccessMessage = function() {
    //$gameMessage.add(TextManager.escapeStart.format($gameParty.name()));
};

BattleManager.displayEscapeFailureMessage = function() {
    //$gameMessage.add(TextManager.escapeStart.format($gameParty.name()));
    //$gameMessage.add('\\.' + TextManager.escapeFailure);
};

BattleManager.displayRewards = function() {
    //this.displayExp();
    //this.displayGold();
    //this.displayDropItems();
};


//-----------------------------------------------------------------------------
// Game_System
//
// The game object class for the system data.

Kien.ShootingRPG.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    Kien.ShootingRPG.Game_System_initialize.apply(this);
    this._shootingRPGEnabled = Kien.ShootingRPG.enableDefault;
    this._shootingRPGBattleMapId = Kien.ShootingRPG.battleMapId;
    this._shootingRPGTurnLength = Kien.ShootingRPG.turnLength;
    this._shootingRPGShowScore = Kien.ShootingRPG.showScore;
    this._shootingRPGBattleEndSwitchId = Kien.ShootingRPG.battleEndSwitchId;
    this._shootingRPGBattleResultVariableId = Kien.ShootingRPG.battleResultVariableId;
    this._shootingRPGAutoFire = Kien.ShootingRPG.autoFire;
    this._shootingRPGNearmiss = false;
    this._shootingRPGScore = 0;
}

//-----------------------------------------------------------------------------
// Game_BattlerBase
//
// The superclass of Game_Battler. It mainly contains parameters calculation.

Kien.ShootingRPG.Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
Game_Battler.prototype.onBattleEnd = function() {
    Kien.ShootingRPG.Game_Battler_onBattleEnd.call(this);
    this._hp = Math.round(this._hp);
};

//-----------------------------------------------------------------------------
// Game_ShootingCharacter
//
// Base class for all shooting RPG battler.

function Game_ShootingCharacter() {
    this.initialize.apply(this, arguments);
}

Object.defineProperty(Game_ShootingCharacter.prototype, 'x', {
    get: function() {return this._boundbox.cx},
    configurable: true,
})

Object.defineProperty(Game_ShootingCharacter.prototype, 'y', {
    get: function() {return this._boundbox.cy},
    configurable: true,
})

Game_ShootingCharacter.prototype.initialize = function(character) {
    this._character = character;
    this._boundbox = new Rectangle(-0.5,-1,1,1);
    this._lastBoundbox = this._boundbox.clone();
    this._projectiles = [];
    this._addedProjectile = [];
}

Game_ShootingCharacter.prototype.positionRect = function() {
    return this._boundbox.clone();
}

Game_ShootingCharacter.prototype.lastPosition = function() {
    var box = this.lastBoundbox();
    return new Kien.Vector2D(box.x, box.y);
}

Game_ShootingCharacter.prototype.lastBoundbox = function() {
    return this._lastBoundbox.clone();
}

Game_ShootingCharacter.prototype.exists = function() {
    return this.battler().isAlive();
}

Game_ShootingCharacter.prototype.difVec = function() {
    return new Kien.Vector2D(0,0);
}

Game_ShootingCharacter.prototype.update =function() {
    this.updateProjectiles();
}

Game_ShootingCharacter.prototype.addProjectile = function(projectileName, initFunc) {
    var proj = new (eval(projectileName))();
    initFunc.call(this, proj, Array.prototype.slice.call(arguments, 2));
    this._projectiles.push(proj);
    this._addedProjectile.push(proj);
}

Game_ShootingCharacter.prototype.checkCollision = function() {
    this._projectiles.forEach(function(p) {
        p.updateCollision();
    });
}

Game_ShootingCharacter.prototype.updateProjectiles = function() {
    this._projectiles.forEach(function(p) {
        p.update();
    });
    var callback = function(p) {
        return p.isFinish();
    };
    var index = this._projectiles.findIndex(callback);
    while(index != -1){
        this._projectiles.splice(index,1);
        index = this._projectiles.findIndex(callback);
    }
}

Game_ShootingCharacter.prototype.applyDamage = function(value) {
    value = value * (1-(this.battler().def/(100+this.battler().def)));
    this.battler().gainHp(-value);
    if (this.battler().isDead()) {
        this.battler().performCollapse();

    } else {
        this.battler().performDamage();
    }
}

//-----------------------------------------------------------------------------
// Game_ShootingPlayer
//
// The game object for Shooting RPG Player

function Game_ShootingPlayer() {
	this.initialize.apply(this, arguments);
}

Game_ShootingPlayer.prototype = Object.create(Game_ShootingCharacter.prototype);
Game_ShootingPlayer.prototype.constructor = Game_ShootingPlayer;

Game_ShootingPlayer.prototype.initialize = function() {
    Game_ShootingCharacter.prototype.initialize.call(this, $gamePlayer);
	this._boundbox = new Rectangle(0,0,Kien.ShootingRPG.playerWidth,Kien.ShootingRPG.playerHeight);
    this._boundbox.x = -this._boundbox.width/2;
    this._boundbox.y = -this._boundbox.height;
    this._waitCount = 0;
    this._difVec = new Kien.Vector2D(0,0);
}

Game_ShootingPlayer.prototype.battler = function() {
    return $gameParty.leader();
}

Game_ShootingPlayer.prototype.difVec = function() {
    return this._difVec;
}

Game_ShootingPlayer.prototype.update = function() {
    Game_ShootingCharacter.prototype.update.call(this);
    this.updateMovement();
    this.updateAttack();
}

Game_ShootingPlayer.prototype.updateMovement = function() {
    var lx = this.x;
    var ly = this.y;
    this._lastBoundbox = this._boundbox.clone();
    this._boundbox.x = this._character.x - this._boundbox.width/2;
    this._boundbox.y = this._character.y - this._boundbox.height - 0.5;
    this._difVec.x = this.x - lx;
    this._difVec.y = this.y - ly;
}

Game_ShootingPlayer.prototype.updateAttack = function() {
    if ((Input.isPressed('ok') != $gameSystem._shootingRPGAutoFire) && this._waitCount == 0) {
        this.callAttackFunction();
    }
    this._waitCount = Math.max(this._waitCount - 1, 0);
}

Game_ShootingPlayer.prototype.callAttackFunction = function() {
    var bat = this.battler();
    if (!! bat.weapons()[0] && !!bat.weapons()[0].meta["AttackFunc"] && !!this[bat.weapons()[0].meta["AttackFunc"]]) {
        this[bat.weapons()[0].meta["AttackFunc"]].call(this);
    } else if (!!bat.actor().meta["AttackFunc"] && !!this[bat.actor().meta["AttackFunc"]]) {
        this[bat.actor().meta["AttackFunc"]].call(this);
    }
}

Game_ShootingPlayer.prototype.setProjectileProperty = function(proj) {
    proj.setPosition(this._character.x, this._character.y);
    proj._damage = this.battler().atk;
    proj._vec = new Kien.Vector2D(0,-1);
    proj._opposite = BattleManager.enemyMember.bind(BattleManager);
    proj._owner = this;
}

Game_ShootingPlayer.prototype.machineGunAttackFunc = function() {
    var initFunc = function(proj) {
        this.setProjectileProperty(proj);
        proj._vec.turn(Math.random()*Math.PI/9 - Math.PI/18);
        proj._vec.setMagnitude(0.125);
    }.bind(this);
    this.addProjectile("Game_ShootingProjectileStraight", initFunc);
    this._waitCount = 5;
}

Game_ShootingPlayer.prototype.shotGunAttackFunc = function() {
    var initFunc = function(proj) {
        this.setProjectileProperty(proj);
        proj._vec.setMagnitude(Math.random() * 0.1 + 0.06);
        proj._vec.turn(Math.random()*Math.PI/6 - Math.PI/12);
        proj._projectileHue = Math.random() * 360;
        proj._damage *= 0.85;
    }.bind(this);
    for (var n = 0; n < 15; n++) {
        this.addProjectile("Game_ShootingProjectileStraight", initFunc);
    }
    this._waitCount = 60;
}

Game_ShootingPlayer.prototype.splitGunAttackFunc = function() {
    var initFunc = function(proj) {
        proj.childFunc = function(proj2, args) {
            this.setProjectileProperty(proj2);
            proj2.setAngle(args[0], args[1]);
            proj._damage *= 0.25;
        };
        this.setProjectileProperty(proj);
        proj._projectileName = "Shot3";
        proj._damage *= 0.4;
        proj._vec.setMagnitude(0.125);
        proj._acc = proj._vec.clone().applyMagnitude(-0.01);
        proj.onFinish = function() {
            for (var n = 0; n <= 360; n += 20) {
                this.addProjectile("Game_ShootingProjectileStraight", this.childFunc.bind(this), Math.deg2Rad(n), 0.1);
            }
        }.bind(proj);
        proj._pierce = 2;
    }.bind(this);
    this.addProjectile("Game_ShootingProjectileStraight", initFunc);
    this._waitCount = 60;
}

//-----------------------------------------------------------------------------
// Game_ShootingEnemy
//
// The game object for Shooting RPG Enemy

function Game_ShootingEnemy() {
    this.initialize.apply(this, arguments);
}

Game_ShootingEnemy.prototype = Object.create(Game_ShootingCharacter.prototype);
Game_ShootingEnemy.prototype.constructor = Game_ShootingEnemy;

Game_ShootingEnemy.prototype.initialize = function(event) {
    Game_ShootingCharacter.prototype.initialize.call(this, event);
    this._enemy = null;
    this._enemyWidth = 0;
    this._enemyHeight = 0;
    this._noteBound = null;
    this._aiFuncName = null;
    this._difVec = new Kien.Vector2D(0,0);
    this._size = 1;
    this.setupEnemy();
}

Game_ShootingEnemy.prototype.battler = function() {
    return this._enemy;
}

Game_ShootingEnemy.prototype.difVec = function() {
    return this._difVec;
}

Game_ShootingEnemy.prototype.update = function() {
    Game_ShootingCharacter.prototype.update.call(this);
    if (this.battler() && this.battler().isAlive()) {
        this.updateMovement();
        this.updateAi();
    }
}

Game_ShootingEnemy.prototype.updateAi = function() {
    if (!!this._aiFuncName && !!this[this._aiFuncName]) {
        this[this._aiFuncName].call(this);
    } else if (this["aiFunc"+this.battler().enemyId()]) {
        this["aiFunc"+this.battler().enemyId()].call(this);
    }
}

Game_ShootingEnemy.prototype.updateMovement = function() {
    var lx = this.x;
    var ly = this.y;
    this._lastBoundbox = this._boundbox.clone();
    this._boundbox.x = this._character._realX - (this._enemyWidth/2) * this._size;
    this._boundbox.y = this._character._realY - (this._enemyHeight) * this._size;
    this._boundbox.width = this._enemyWidth * this._size;
    this._boundbox.height = this._enemyHeight * this._size;
    if (this._noteBound) {
        this._boundbox.x += this._noteBound.x * this._size;
        this._boundbox.y += this._noteBound.y * this._size;
        this._boundbox.width = this._noteBound.width * this._size;
        this._boundbox.height = this._noteBound.height * this._size;
    }
    this._difVec.x = this.x - lx;
    this._difVec.y = this.y - ly;
}

Game_ShootingEnemy.prototype.setupEnemy = function() {
    var str = this._character.event().meta["EnemyIndex"];
    var arr = str.split(",");
    if (arr.length == 1) {
        if ($gameTroop.members().length == 1) {
            this._enemy = $gameTroop.members()[0];
        }
    } else if (parseInt(arr[0],10) == $gameTroop.members().length) {
        this._enemy = $gameTroop.members()[parseInt(arr[1],10)-1];
    }
    this.setupEnemyInfo();
    $gameSelfSwitches.setValue([this._character._mapId, this._character._eventId, "A"], false);
}

Game_ShootingEnemy.prototype.setupEnemyInfo = function() {
    if (this._enemy) {
        this._enemy.screenX = this._character.screenX.bind(this._character);
        this._enemy.screenY = this._character.screenY.bind(this._character);
        var bitmap = ImageManager.loadEnemy(this._enemy.battlerName(), this._enemy.battlerHue());
        bitmap.addLoadListener(function() {
            this._enemyWidth = bitmap.width / $gameMap.tileWidth();
            this._enemyHeight = bitmap.height / $gameMap.tileHeight();
        }.bind(this));
        this._aiFuncName = this._enemy.enemy().meta["ShootingAi"];
        if (this._enemy.enemy().meta["ShootingAiInit"] && this[this._enemy.enemy().meta["ShootingAiInit"]]) {
            this[this._enemy.enemy().meta["ShootingAiInit"]].call(this);
        }
        if (this._enemy.enemy().meta["ShootingBoundbox"]) {
            this._noteBound = Rectangle.fromString(this._enemy.enemy().meta["ShootingBoundbox"]);
            this._noteBound.x = this._noteBound.x / $gameMap.tileWidth();
            this._noteBound.y = this._noteBound.y / $gameMap.tileHeight();
            this._noteBound.width = this._noteBound.width / $gameMap.tileWidth();
            this._noteBound.height = this._noteBound.height / $gameMap.tileHeight();
        }
        if (this._enemy.enemy().meta["ShootingSize"]) {
            this._size = parseFloat(this._enemy.enemy().meta["ShootingSize"]);
        }
    }
}

Game_ShootingEnemy.prototype.setProjectileProperty = function(proj) {
    proj._damage = this.battler().atk;
    proj._opposite = BattleManager.playerMember.bind(BattleManager);
    proj._projectileName = this._enemy.enemy().meta["ShootingProjectileImage"] || proj._projectileName;
    proj.setPosition(this.x, this.y);
    proj._checkNearmiss = true;
    proj._owner = this;
}

Game_ShootingEnemy.prototype.getPlayerVector = function() {
    var tx = $gamePlayer.x;
    var ty = $gamePlayer.y;;
    return Kien.Vector2D.getDirectionVector(this._character.x, this._character.y,tx,ty)
}

Game_ShootingEnemy.prototype.applyDamage = function(value) {
    var chp = this.battler().hp;
    Game_ShootingCharacter.prototype.applyDamage.call(this, value);
    $gameSystem._shootingRPGScore += Math.round(chp - this.battler().hp) * 10;
    if (this.battler().isDead()) {
        $gameSelfSwitches.setValue([this._character._mapId, this._character._eventId, "A"], true);
    }
}

Game_ShootingEnemy.prototype.testAiFunc = function() {
    this._waitCount = this._waitCount || 0;
    if (this._waitCount == 0) {
        var tx = $gamePlayer.x;
        var ty = $gamePlayer.y;
        var initFunc = function(proj) {
            this.setProjectileProperty(proj);
            proj.setTarget(BattleManager.player, 1);
        }
        //this.addProjectile("Game_ShootingProjectileStraight", initFunc);
        this._waitCount = 30;
    } else {
        this._waitCount--;
    }
}

Game_ShootingEnemy.prototype.testAiFunc2 = function() {
    this._waitCount = this._waitCount || 0;
    if (this._projectiles.length == 0) {
        var vec = this.getPlayerVector();
        var initFunc = function(proj) {
            this.setProjectileProperty(proj);
            proj.setTarget(BattleManager.player, 0.25);
        }
        this.addProjectile("Game_ShootingProjectileFollow", initFunc);
        this._waitCount = 30;
    } else {
        //this._waitCount--;
    }
}

Game_ShootingEnemy.prototype.testAiFunc3 = function() {
    this._waitCount = this._waitCount || 0;
    this._angle = this._angle || 0;
    if (this._waitCount == 0) {
        var vec = this.getPlayerVector();
        var initFunc = function(proj, args) {
            this.setProjectileProperty(proj);
            proj._damage *= 0.2
            proj.setTarget(BattleManager.player, 0.25);
            proj.setAngle(args[0], 0.15);
        }
        for (var angle = this._angle; angle < 360+this._angle; angle+= 30) {
            this.addProjectile("Game_ShootingProjectileFollow", initFunc, Math.deg2Rad(angle));
        }
        var initFunc2 = function(proj) {
            this.setProjectileProperty(proj);
            proj._projectileHue = 90;
            proj.setTarget(BattleManager.player, 0.1);
        }
        this.addProjectile("Game_ShootingProjectileStraight", initFunc2);
        this._waitCount = 15;
        this._angle = (this._angle + 10) % 360;
    } else {
        this._waitCount--;
    }
}

Game_ShootingEnemy.prototype.testAiFunc4 = function() {
    this._waitCount = this._waitCount || 0;
    this._angle = this._angle || 0;
    if (this._waitCount == 0) {
        var vec = this.getPlayerVector();
        var initFunc = function(proj, args) {
            this.setProjectileProperty(proj);
            proj.setAngle(args[0], Math.min(0.04, 0.015 / this.battler().hpRate()));
        }
        this.addProjectile("Game_ShootingProjectileStraight", initFunc, Math.deg2Rad(this._angle));
        this._waitCount = Math.floor(3 * this.battler().hpRate());
        this._angle = (this._angle + 2) % 360;
    } else {
        this._waitCount--;
    }
}

Game_ShootingEnemy.prototype.testAiFunc5 = function() {
    this._waitCount = this._waitCount || 0;
    this._angle = this._angle || 0;
    if (this._waitCount == 0) {
        var vec = this.getPlayerVector();
        var initFunc = function(proj, args) {
            this.setProjectileProperty(proj);
            proj._damage *= 0.2
            proj.setAngle(args[0], 0.10);
        }
        for (var angle = this._angle; angle < 360+this._angle; angle+= 30) {
            this.addProjectile("Game_ShootingProjectileStraight", initFunc, Math.deg2Rad(angle));
        }
        if (!!this._shot) {
            var initFunc2 = function(proj) {
                this.setProjectileProperty(proj);
                proj._projectileHue = 90;
                proj.setTarget(BattleManager.player, 0.15, 0, Math.PI/360);
            }
            this.addProjectile("Game_ShootingProjectileFollow", initFunc2);
            this._shot = false;
        } else {
            this._shot = true;
        }
        this._waitCount = 15;
        this._angle = (this._angle + 20) % 360;
    } else {
        this._waitCount--;
    }
}

Game_ShootingEnemy.prototype.testAiFunc6 = function() {
    this._waitCount = this._waitCount || 0;
    if (this._waitCount == 0) {
        var initFunc = function(proj, args) {
            this.setProjectileProperty(proj);
            proj._vec.x = 0;
            proj._vec.y = 2 * args[0];
            proj._vec.setMagnitude(0.5);
            proj._vecChange = Math.PI/2;
            proj._changeTime = Math.floor(Math.PI / proj._vecChange);
            proj.oldUpdate = proj.updateMovement;
            proj.updateMovement = function() {
                this._vec.turn(this._vecChange, -1);
                //this._vec.setMagnitude(this._vec.magnitude);
                if (this._changeTime == 0) {
                    this._vecChange *= 0.8;
                    this._changeTime = Math.floor(Math.PI / proj._vecChange);;
                } else {
                    this._changeTime--;
                }
                this.oldUpdate();
            }
            proj.isValid = function() {
                return Math.sqrt((Math.pow(this.realX(), 2) + Math.pow(this.realY(), 2))) < 100;
            }
        }
        this.addProjectile("Game_ShootingProjectileStraight", initFunc, 1);
        this.addProjectile("Game_ShootingProjectileStraight", initFunc, -1);
        this._waitCount = 60;
    } else {
        this._waitCount--;
    }
}

//-----------------------------------------------------------------------------
// Game_ShootingSubEnemy
//
// The game object for event generated enemy object.

function Game_ShootingSubEnemy() {
    this.initialize.apply(this, arguments);
}

Game_ShootingSubEnemy.prototype = Object.create(Game_ShootingCharacter.prototype);
Game_ShootingSubEnemy.prototype.constructor = Game_ShootingSubEnemy;

Game_ShootingSubEnemy.prototype.initialize = function(obj) {
    Game_ShootingCharacter.prototype.initialize.call(this);
    this._boundbox = obj.boundbox;
    this._lastBoundbox = this._boundbox.clone();
    this._difVec = new Kien.Vector2D(0,0);
    this._onDead = obj.ondead;
    this._onDamage = obj.ondamage;
    this._src = obj.src;
    this._hp = obj.hp;
    this._def = obj.def;
    this._isActor = obj.isactor;
}

Game_ShootingSubEnemy.prototype.difVec = function() {
    return this._difVec;
}

Game_ShootingSubEnemy.prototype.update = function() {
    Game_ShootingCharacter.prototype.update.call(this);
    this.updatePosition();
}

Game_ShootingSubEnemy.prototype.updatePosition = function() {
    var lx = this.x;
    var ly = this.y;
    this._boundbox.x = this._src._realX - this._boundbox.width/2;
    this._boundbox.y = this._src._realY - this._boundbox.height;
    this._difVec.x = this.x - lx;
    this._difVec.y = this.y - ly;
}

Game_ShootingSubEnemy.prototype.exists = function() {
    return this._hp > 0;
}

Game_ShootingSubEnemy.prototype.applyDamage = function(value) {
    value = value * (1-(this._def/(100+this._def)));
    this._hp -= value;
    if (!this.exists()) {
        this._onDead();
    } else {
        this._onDamage();
    }
}

//-----------------------------------------------------------------------------
// Game_ShootingProjectileBase
//
// The game object for Shooting RPG Projectile

function Game_ShootingProjectileBase() {
    this.initialize.apply(this, arguments);
}

Object.defineProperty(Game_ShootingProjectileBase.prototype, 'x', {
    get: function() {return this.realX()},
    configurable: true
})


Object.defineProperty(Game_ShootingProjectileBase.prototype, 'y', {
    get: function() {return this.realY()},
    configurable: true
})

Game_ShootingProjectileBase.prototype.initialize = function() {
    this._boundDx = -0.05;
    this._boundDy = -0.05;
    this._boundbox = new Rectangle(this._boundDy,this._boundDx,0.1,0.1);
    this._lastBoundbox = this._boundbox.clone();
    this._projectileName = "Shot";
    this._projectileHue = 0;
    this._finish = false;
    this._opposite = function() {return []};
    this._damage = 0;
    this._pierce = 1;
    this._hit = {};
    this._hitIndex = [];
    this._checkNearmiss = false;
    this._owner = null;
}

Game_ShootingProjectileBase.prototype.isFinish = function() {
    return this._finish;
}

Game_ShootingProjectileBase.prototype.isValid = function() {
    return $gameMap.isValid(this.realX(),this.realY());
}

Game_ShootingProjectileBase.prototype.update = function() {
    if (this.isFinish()) {
        return;
    }
    this.updateMovement();
    this.updateHitted();
}

Game_ShootingProjectileBase.prototype.difVec = function() {
    return new Kien.Vector2D(0,0);
}

Game_ShootingProjectileBase.prototype.updateMovement = function() {
    this._lastBoundbox = this._boundbox.clone();
    if (!this.isValid()) {
        this._finish = true;
        this.onFinish();
        return;
    }
    if (this.difVec().magnitude <= 0.0001) {
        this._finish = true;
        this.onFinish();
        return;
    }
}

Game_ShootingProjectileBase.prototype.updateHitted = function() {
    for (var n = 0; n < this._hitIndex.length; n++) {
        var bat = this._hitIndex[n];
        this._hit[bat].dur--;
    }
    var callback = function(b) {
        return this._hit[b].dur <= 0 || (Kien.Vector2D.getDisplacementVector(this.realX(),this.realY(),this._hit[b].x,this._hit[b].y).magnitude >= 1.0);
    }.bind(this);
    var i = this._hitIndex.findIndex(callback);
    while(i >= 0) {
        var b = this._hitIndex[i];
        delete this._hit[b];
        this._hitIndex.splice(i,1);
        i = this._hitIndex.findIndex(callback);
    }
}

Game_ShootingProjectileBase.prototype.updateCollision = function() {
    if (BattleManager.isBattleEnd() || !$gameParty.inBattle() || SceneManager.isSceneChanging()){
        return;
    }
    var oppos = this.opposites();
    for (var i = 0; i < oppos.length; i++) {
        var t = oppos[i];
        if (t.exists() && this.isCollide(t)) {
            this.onCollide(t);
            if (this.isFinish()) {
                return;
            }
        } else {
            if (this._checkNearmiss) {
                var dis = this._boundbox.radius + t._boundbox.radius + 0.09;
                var dv = Kien.Vector2D.getDisplacementVector(this.x, this.y, t.x, t.y);
                if (this._checkNearmiss && this.difVec().dot(dv) <= 0.01 && dv.magnitude <= dis) {
                    $gameSystem._shootingRPGScore += 100;
                    $gameSystem._shootingRPGNearmiss = true;
                }
            }
        }
    }
}

Game_ShootingProjectileBase.prototype.lastPosition = function() {
    var box = this.lastBoundbox();
    return new Kien.Vector2D(box.x, box.y);
}

Game_ShootingProjectileBase.prototype.lastBoundbox = function() {
    return this._lastBoundbox.clone();
}

Game_ShootingProjectileBase.prototype.isCollide = function(other) {
    if (this.positionRect().overlap(other.positionRect())) {
        return true;
    }
    var lp = this.lastPosition();
    var tlb = this.lastBoundbox();
    var lb = other.lastBoundbox();
    lb.left -= tlb.width;
    lb.top -= tlb.height;
    var dif = this.difVec();
    var rv = dif.subtract(other.difVec());
    if (rv.x != 0) {
        var xSide = rv.x > 0 ? lb.left : lb.right;
        var t = (xSide - lp.x) / rv.x;
        if (t >= 0 && t <= 1) {
            var yd = lp.y + rv.y * t;
            if (yd >= lb.top && yd < lb.bottom) {
                return true;
            }
        }
    }

    if (rv.y != 0) {
        var ySide = rv.y > 0 ? lb.top : lb.bottom;
        var t = (ySide - lp.y) / rv.y;
        if (t >= 0 && t <= 1) {
            var xd = lp.x + rv.x * t;
            if (xd >= lb.left && xd < lb.right) {
                return true;
            }
        }
    }

    return false;
}

Game_ShootingProjectileBase.prototype.positionRect = function() {
    return this._boundbox.clone();
}

Game_ShootingProjectileBase.prototype.position = function() {
    return new Kien.Vector2D(this._boundbox.cx, this._boundbox.cy);
}

Game_ShootingProjectileBase.prototype.opposites = function() {
    return this._opposite.call();
}

Game_ShootingProjectileBase.prototype.projectileImage = function() {
    return this._projectileName;
}

Game_ShootingProjectileBase.prototype.projectileHue = function() {
    return this._projectileHue;
}

Game_ShootingProjectileBase.prototype.scrolledX = function() {
    return $gameMap.adjustX(this.realX());
};

Game_ShootingProjectileBase.prototype.scrolledY = function() {
    return $gameMap.adjustY(this.realY());
};

Game_ShootingProjectileBase.prototype.screenX = function() {
    var tw = $gameMap.tileWidth();
    return Math.round(this.scrolledX() * tw);
};

Game_ShootingProjectileBase.prototype.rotationAngle = function() {
    return 0;
}

Game_ShootingProjectileBase.prototype.screenY = function() {
    var th = $gameMap.tileHeight();
    return Math.round(this.scrolledY() * th);
};

Game_ShootingProjectileBase.prototype.setPosition = function(x, y) {
    this._boundbox.x = x + this._boundDx;
    this._boundbox.y = y + this._boundDy;
}

Game_ShootingProjectileBase.prototype.realX = function() {
    return this._boundbox.x - this._boundDx;
}

Game_ShootingProjectileBase.prototype.realY = function() {
    return this._boundbox.y - this._boundDy;
}

Game_ShootingProjectileBase.prototype.onCollide = function(target) {
    if (!this._hit[target] && target.exists()){
        var damage = this.modifyDamage(target);
        target.applyDamage(damage);
        this._pierce--;
        if (this._pierce > 0) {
            this._hit[target] = {x : this.realX(), y : this.realY(), dur: 10};
            this._hitIndex.push(target);
        } else {
            this._finish = true;
            this.onFinish();
        }
    }
}

Game_ShootingProjectileBase.prototype.modifyDamage = function(battler) {
    return this._damage;
}

Game_ShootingProjectileBase.prototype.onFinish = function() {

}

Game_ShootingProjectileBase.prototype.addProjectile = function(projectileName, initFunc) {
    if (!!this._owner) {
        this._owner.addProjectile.apply(this._owner, arguments);
    }
}

Game_ShootingProjectileBase.prototype.setProjectileProperty = function(proj) {
    this._owner.setProjectileProperty(proj);
    proj.setPosition(this.x, this.y);
}

//-----------------------------------------------------------------------------
// Game_ShootingProjectileStraight
//
// The game object for Shooting RPG Projectile

function Game_ShootingProjectileStraight() {
    this.initialize.apply(this, arguments);
}

Game_ShootingProjectileStraight.prototype = Object.create(Game_ShootingProjectileBase.prototype);
Game_ShootingProjectileStraight.prototype.constructor = Game_ShootingProjectileStraight;

Game_ShootingProjectileStraight.prototype.initialize = function() {
    Game_ShootingProjectileBase.prototype.initialize.call(this);
    this._vec = new Kien.Vector2D(0,0);
    this._acc = new Kien.Vector2D(0,0);
}

Game_ShootingProjectileStraight.prototype.updateMovement = function() {
    Game_ShootingProjectileBase.prototype.updateMovement.call(this);
    if (this._vec.magnitude > 0) {
        this._boundbox.x += this._vec.x;
        this._boundbox.y += this._vec.y;
        if (this._acc.magnitude > 0) {
            this._vec.x += this._acc.x;
            this._vec.y += this._acc.y;
        }
    }
}

Game_ShootingProjectileStraight.prototype.rotationAngle = function() {
    return this._vec ? this._vec.angleBetween(Kien.Vector2D.xUnitVector) * this._vec.clockwise(Kien.Vector2D.xUnitVector) * -1 : 0;
}

Game_ShootingProjectileStraight.prototype.difVec = function() {
    return this._vec.clone();
}

Game_ShootingProjectileStraight.prototype.setTarget = function(target, speed, vary) {
    if (!!vary) {
        var v = Kien.Vector2D.getDirectionVector(this.realX(), this.realY(), target.x, target.y);
        this.setAngle(Kien.Vector2D.xUnitVector.angleBetween(v) * Kien.Vector2D.xUnitVector.clockwise(v), speed, vary);
    } else {
        this._vec = Kien.Vector2D.getDirectionVector(this.realX(), this.realY(), target.x, target.y).applyMagnitude(speed);
    }
}

Game_ShootingProjectileStraight.prototype.setAngle = function(angle, speed, vary) {
    this._vec = Kien.Vector2D.xUnitVector.clone().turn(angle + (!!vary ? vary : 0)).applyMagnitude(speed);
}

//-----------------------------------------------------------------------------
// Game_ShootingProjectileFollow
//
// The game object for Shooting RPG Projectile

function Game_ShootingProjectileFollow() {
    this.initialize.apply(this, arguments);
}

Game_ShootingProjectileFollow.prototype = Object.create(Game_ShootingProjectileStraight.prototype);
Game_ShootingProjectileFollow.prototype.constructor = Game_ShootingProjectileFollow;

Game_ShootingProjectileFollow.prototype.initialize = function() {
    Game_ShootingProjectileStraight.prototype.initialize.call(this);
    this._target = null;
    this._followAmount = Math.PI/180;
}

Game_ShootingProjectileFollow.prototype.updateMovement = function() {
    Game_ShootingProjectileStraight.prototype.updateMovement.call(this);
    if (this._target) {
        var vec = this.getDirectionVector();
        var ang = this._vec.angleBetween(vec);
        ang = ang.clamp(-this._followAmount, this._followAmount);
        this._vec.turn(ang, this._vec.clockwise(vec));
    }
}

Game_ShootingProjectileFollow.prototype.getDirectionVector = function() {
    if (this._target) {
        return Kien.Vector2D.getDirectionVector(this.realX(), this.realY(), this._target.x, this._target.y);
    }
    return this._vec.clone().unit();
}

Game_ShootingProjectileFollow.prototype.setTarget = function(target, speed, vary, amount) {
    Game_ShootingProjectileStraight.prototype.setTarget.apply(this, arguments);
    this._target = target;
    this._followAmount = amount;
}

//-----------------------------------------------------------------------------
// Game_ShootingProjectileWave
//
// The game object for Shooting RPG Projectile

function Game_ShootingProjectileWave() {
    this.initialize.apply(this, arguments);
}

Game_ShootingProjectileWave.prototype = Object.create(Game_ShootingProjectileStraight.prototype);
Game_ShootingProjectileWave.prototype.constructor = Game_ShootingProjectileWave;

Game_ShootingProjectileWave.prototype.initialize = function() {
    Game_ShootingProjectileStraight.prototype.initialize.call(this);
    this._period = 0;
    this._ox = null;
    this._oy = null;
    this._pvec = new Kien.Vector2D(0,0);
}

Game_ShootingProjectileWave.prototype.updateMovement = function() {
    if (this._ox === null) {
        this._ox = this._boundbox.x;
        this._oy = this._boundbox.y;
    }
    this._boundbox.x = this._ox;
    this._boundbox.y = this._oy;
    Game_ShootingProjectileStraight.prototype.updateMovement.call(this);
    this._ox = this._boundbox.x;
    this._oy = this._boundbox.y;
    this._pvec = this._vec.crossProduct().setMagnitude(Math.sin(Math.deg2Rad(this._period)));
    this._boundbox.x += this._pvec.x;
    this._boundbox.y += this._pvec.y;
    this._period = (this._period + 10) % 360;
}

Game_ShootingProjectileWave.prototype.difVec = function() {
    return Game_ShootingProjectileStraight.prototype.difVec.call(this).add(this._pvec);
}

//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Kien.ShootingRPG.Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
    this._eventData = $dataMap.events[eventId];
    Kien.ShootingRPG.Game_Event_initialize.call(this, mapId, eventId);
};


Game_Event.prototype.event = function() {
    return this._eventData;
};

Game_Event.prototype.createSubEnemy = function(boxwidth, boxheight, isActor, thp, tdef, tonDead, tonDamage) {
    return {
        src: this,
        boundbox: new Rectangle(this.x-boxwidth/2, this.y-boxheight, boxwidth, boxheight),
        hp: thp,
        def: tdef,
        ondead: tonDead || function() {this.defaultSubEnemyOnDead()}.bind(this),
        ondamage: tonDamage || function() {this.defaultSubEnemyOnDamage(isActor)}.bind(this),
        isactor: isActor
    }
}

Game_Event.prototype.defaultSubEnemyOnDead = function() {
    $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
    BattleManager.removeSubEnemy(this)
}

Game_Event.prototype.defaultSubEnemyOnDamage = function(isActor) {
    isActor ? SoundManager.playActorDamage() : SoundManager.playEnemyDamage();
    if (Imported.Kien_CharacterShake) {
        this.kienStartBlink(60,10);
    }
}

Game_Event.prototype.addSubEnemy = function(boxwidth, boxheight, isActor, thp, tdef, tonDead, tonDamage) {
    BattleManager.addSubEnemy(this.createSubEnemy.apply(this, arguments));
}
//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

// Battle Processing
Kien.ShootingRPG.Game_Interpreter_command301 = Game_Interpreter.prototype.command301;
Game_Interpreter.prototype.command301 = function() {
    if ($gameSystem._shootingRPGEnabled) {
        if (!$gameParty.inBattle()) {
            var troopId;
            if (this._params[0] === 0) {  // Direct designation
                troopId = this._params[1];
            } else if (this._params[0] === 1) {  // Designation with a variable
                troopId = $gameVariables.value(this._params[1]);
            } else {  // Same as Random Encounter
                troopId = $gamePlayer.makeEncounterTroopId();
            }
            if ($dataTroops[troopId]) {
                BattleManager.setup(troopId, this._params[2], this._params[3]);
                BattleManager.setEventCallback(function(n) {
                    this._branch[this._indent] = n;
                }.bind(this));
                $gamePlayer.makeEncounterCount();
                SceneManager.push(Scene_BattleShooting);
            }
        }
        return true;
    } else {
        return Kien.ShootingRPG.Game_Interpreter_command301.call(this);
    }
};

// Script
Game_Interpreter.prototype.command355 = function() {
    var script = this.currentCommand().parameters[0] + '\n';
    while (this.nextEventCode() === 655 || this.nextEventCode() === 355) {
        this._index++;
        script += this.currentCommand().parameters[0] + '\n';
    }
    eval(script);
    return true;
};

Game_Interpreter.prototype.event = function(param) {
    if (param < 0) {
        return $gamePlayer;
    } else if (this.isOnCurrentMap()) {
        return $gameMap.event(param > 0 ? param : this._eventId);
    } else {
        return undefined;
    }
}

Game_Interpreter.prototype.battler = function(param) {
    return BattleManager.getBattlerFromEvent(this.event(param));
}

Game_Interpreter.prototype.character = function(param) {
    if ($gameParty.inBattle() && !$gameSystem._shootingRPGEnabled) {
        return null;
    } else if (param < 0) {
        return $gamePlayer;
    } else if (this.isOnCurrentMap()) {
        return $gameMap.event(param > 0 ? param : this._eventId);
    } else {
        return null;
    }
};

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

Kien.ShootingRPG.Sprite_Character_update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
    Kien.ShootingRPG.Sprite_Character_update.call(this);
    this.updateDebug();
};

Sprite_Character.prototype.updateDebug = function() {
    if (Kien.ShootingRPG.debugMode && $gameParty.inBattle()) {
        var battler = BattleManager.getSubenemyFromEvent(this._character);
        if (battler) {
            var rect = battler.positionRect();
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
                    this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
                    this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,255,255,0.5)");
                }
                this._debugSprite.x = rect.x;
                this._debugSprite.y = rect.y;
            }
        } else {
            if (!!this._debugSprite) {
                this.onRemoved();
                this._debugSprite = null;
            }
        }
    }
}

Sprite_Character.prototype.onRemoved = function() {
    if (!!this._debugSprite) {
        this._debugSprite.parent.removeChild(this._debugSprite);
    }
}

//-----------------------------------------------------------------------------
// Sprite_ShootingPlayer
//
// Current only use to add projectiles.

function Sprite_ShootingPlayer() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingPlayer.prototype = Object.create(Sprite_Character.prototype);
Sprite_ShootingPlayer.prototype.constructor = Sprite_ShootingPlayer;

Sprite_ShootingPlayer.prototype.initialize = function() {
    this._battler = BattleManager.player;
    Sprite_Character.prototype.initialize.call(this, $gamePlayer);
    this.once("removed", this.onRemoved, this);
};

Sprite_ShootingPlayer.prototype.initMembers = function() {
    Sprite_Character.prototype.initMembers.call(this);
    this._projectiles = [];
}

Sprite_ShootingPlayer.prototype.update = function() {
    Sprite_Character.prototype.update.call(this);
    this.updateProjectile();
    this.updateDebug();
}

Sprite_ShootingPlayer.prototype.updateProjectile = function() {
    for (var n = 0; n < this._battler._addedProjectile.length; n++) {
        var projectile = this._battler._addedProjectile[n];
        var sprite = new Sprite_ShootingProjectile(projectile);
        this._projectiles.push(sprite);
        this.parent.addChild(sprite);
    }
    this._battler._addedProjectile.clear();
    var callback = function(s) {
        return s._finish;
    }
    var i = this._projectiles.findIndex(callback);
    while (i >= 0) {
        var sprite = this._projectiles[i];
        this.parent.removeChild(sprite);
        this._projectiles.splice(i, 1);
        i = this._projectiles.findIndex(callback);
    }
}

Sprite_ShootingPlayer.prototype.updateDebug = function() {
    //if (Kien.ShootingRPG.debugMode) {
        var rect = this._battler.positionRect();
        var tw = $gameMap.tileWidth();
        var th = $gameMap.tileHeight();
        rect.x = $gameMap.adjustX(rect.x) * tw;
        rect.y = $gameMap.adjustY(rect.y) * th;
        rect.width = rect.width * tw;
        rect.height = rect.height * th;
        if (!!!this._debugSprite) {
            this._debugSprite = new Sprite();
            this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
            this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,0,0,1)");
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
            this.parent.addChild(this._debugSprite);
        } else {
            if (this._debugSprite.bitmap.width != rect.width || this._debugSprite.bitmap.height != rect.height) {
                this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
                this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,0,0,1)");
            }
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
        }
    //}
}

Sprite_ShootingPlayer.prototype.onRemoved = function() {
    if (!!this._debugSprite) {
        this._debugSprite.parent.removeChild(this._debugSprite);
    }
}

//-----------------------------------------------------------------------------
// Sprite_ShootingEnemy
//
// The sprite for displaying a character.

function Sprite_ShootingEnemy() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingEnemy.prototype = Object.create(Sprite_Enemy.prototype);
Sprite_ShootingEnemy.prototype.constructor = Sprite_ShootingEnemy;

Sprite_ShootingEnemy.prototype.initialize = function(character) {
    this._character = character;
    this._projectiles = [];
    Sprite_Enemy.prototype.initialize.call(this, this._character._enemy);
    this.once("removed", this.onRemoved, this);
};

Sprite_ShootingEnemy.prototype.update = function() {
    Sprite_Enemy.prototype.update.call(this);
    this.updateColorTone();
    this.updateProjectile();
    this.updateDebug();
}

Sprite_ShootingEnemy.prototype.updatePosition = function() {
    this.updateHome();
    Sprite_Enemy.prototype.updatePosition.call(this);
};

Sprite_ShootingEnemy.prototype.updateHome = function() {
    this._homeX = this._battler.screenX();
    this._homeY = this._battler.screenY(); 
    this.scale.x = this._character._size;
    this.scale.y = this._character._size;
}

Sprite_ShootingEnemy.prototype.updateColorTone = function() {
    this.setColorTone([(1-this._enemy.hpRate()) * 255,0,0,(1-this._enemy.hpRate())*128]);
}

Sprite_ShootingEnemy.prototype.updateProjectile = function() {
    for (var n = 0; n < this._character._addedProjectile.length; n++) {
        var projectile = this._character._addedProjectile[n];
        var sprite = new Sprite_ShootingProjectile(projectile);
        this._projectiles.push(sprite);
        this.parent.addChild(sprite);
    }
    this._character._addedProjectile.clear();
    var callback = function(s) {
        return s._finish;
    }
    var i = this._projectiles.findIndex(callback);
    while (i >= 0) {
        var sprite = this._projectiles[i];
        this.parent.removeChild(sprite);
        this._projectiles.splice(i, 1);
        i = this._projectiles.findIndex(callback);
    }
}

Sprite_ShootingEnemy.prototype.updateDebug = function() {
    if (Kien.ShootingRPG.debugMode) {
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
                this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
                this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,255,255,0.5)");
            }
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
        }
    }
}

Sprite_ShootingEnemy.prototype.updateBlink = function() {
    this.opacity = (this._effectDuration % 6 < 3) ? 255 : 0;
};

Sprite_ShootingEnemy.prototype.onRemoved = function() {
    if (!!this._debugSprite) {
        this._debugSprite.parent.removeChild(this._debugSprite);
    }
}

//-----------------------------------------------------------------------------
// Sprite_ShootingExtra
//
// Use to show extra projectiles.

function Sprite_ShootingExtra() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingExtra.prototype = Object.create(Sprite_Base.prototype);
Sprite_ShootingExtra.prototype.constructor = Sprite_ShootingExtra;

Sprite_ShootingExtra.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this._character = BattleManager.extra;
    this._projectiles = [];
    this.once("removed", this.onRemoved, this);
}

Sprite_ShootingExtra.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this.updateProjectile();
}

Sprite_ShootingExtra.prototype.updateProjectile = function() {
    for (var n = 0; n < this._character._addedProjectile.length; n++) {
        var projectile = this._character._addedProjectile[n];
        var sprite = new Sprite_ShootingProjectile(projectile);
        this._projectiles.push(sprite);
        this.parent.addChild(sprite);
    }
    this._character._addedProjectile.clear();
    var callback = function(s) {
        return s._finish;
    }
    var i = this._projectiles.findIndex(callback);
    while (i >= 0) {
        var sprite = this._projectiles[i];
        this.parent.removeChild(sprite);
        this._projectiles.splice(i, 1);
        i = this._projectiles.findIndex(callback);
    }
}

//-----------------------------------------------------------------------------
// Sprite_ShootingProjectile
//
// The sprite for displaying a projectile.

function Sprite_ShootingProjectile() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingProjectile.prototype = Object.create(Sprite_Base.prototype);
Sprite_ShootingProjectile.prototype.constructor = Sprite_ShootingProjectile;

Sprite_ShootingProjectile.prototype.initialize = function(proj) {
    Sprite_Base.prototype.initialize.call(this);
    this.projectile = proj;
    this._projectileName = null;
    this._projectileHue = 0;
    this._finish = false;
    this.once("removed", this.onRemoved, this);
}

Sprite_ShootingProjectile.prototype.update = function() {
    if (!this._finish) {
        this.updateBitmap();
        this.updatePosition();
        this.updateRotation();
        this.updateDebug();
    }
}

Sprite_ShootingProjectile.prototype.updateBitmap = function() {
    if (this.projectile.projectileImage() != this._projectileName || this.projectile.projectileHue() != this._projectileHue) {
        this._projectileName = this.projectile.projectileImage();
        this._projectileHue = this.projectile.projectileHue();
        this.bitmap = ImageManager.loadSystem(this._projectileName, this._projectileHue);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    }
}

Sprite_ShootingProjectile.prototype.updatePosition = function() {
    this.x = this.projectile.screenX();
    this.y = this.projectile.screenY();
    if (this.projectile.isFinish()) {
        this._finish = true;
    }
}

Sprite_ShootingProjectile.prototype.updateRotation = function() {
    this.rotation = this.projectile.rotationAngle();
}

Sprite_ShootingProjectile.prototype.updateDebug = function() {
    if (Kien.ShootingRPG.debugMode) {
        var rect = this.projectile.positionRect();
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
                this._debugSprite.bitmap = new Bitmap(rect.width, rect.height);
                this._debugSprite.bitmap.fillRect(0,0,rect.width,rect.height,"rgba(255,255,255,0.5)");
            }
            this._debugSprite.x = rect.x;
            this._debugSprite.y = rect.y;
        }
    }
}

Sprite_ShootingProjectile.prototype.onRemoved = function() {
    if (!!this._debugSprite) {
        this._debugSprite.parent.removeChild(this._debugSprite);
    }
}

//

//-----------------------------------------------------------------------------
// Sprite_ShootingHpGauge
//
// The sprite for displaying a projectile.

function Sprite_ShootingHpGauge() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingHpGauge.prototype = Object.create(Sprite_Base.prototype);
Sprite_ShootingHpGauge.prototype.constructor = Sprite_ShootingHpGauge;

Sprite_ShootingHpGauge.prototype.initialize = function(gaugeTarget, type) {
    Sprite_Base.prototype.initialize.call(this);
    this._gaugeFunc = gaugeTarget;
    this._lastValue = 0;
    this._type = type;
    this.createGaugeSprite();
    this.createBitmap();
}

Sprite_ShootingHpGauge.prototype.createGaugeSprite = function() {
    this._gaugeSprite = new Sprite();
    this._gaugeSprite.bitmap = new Bitmap(12, this._type ? 108 : 204);
    this._gaugeSprite.x = 6;
    this._gaugeSprite.y = 6;
    this.addChild(this._gaugeSprite);
}

Sprite_ShootingHpGauge.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(24, this._type ? 144 : 240);
    this.x = this._type ? 24 : Graphics.width - 24 - this.bitmap.width;
    this.y = 7 * $gameMap.tileHeight() - this.bitmap.height;
    this._palette = ImageManager.loadSystem("hpGauge");
    this._palette.addLoadListener(this.onBitmapLoaded.bind(this));
}

Sprite_ShootingHpGauge.prototype.onBitmapLoaded = function() {
    this.bitmap.clear();
    if (this._type) {
        this.bitmap.blt(this._palette,24,0,24,12,0,0);
        for (var i = 0; i < 4; i++) {
            this.bitmap.blt(this._palette,24,12,24,24,0,12+24*i);
        }
        this.bitmap.blt(this._palette,24,36,24,12,0,108);
        this.bitmap.blt(this._palette,0,24,24,24,0,120);
    } else {
        this.bitmap.blt(this._palette,24,0,24,12,0,0);
        for (var i = 0; i < 8; i++) {
            this.bitmap.blt(this._palette,24,12,24,24,0,12+24*i);
        }
        this.bitmap.blt(this._palette,24,36,24,12,0,204);
        this.bitmap.blt(this._palette,0,0,24,24,0,216);
    }
}

Sprite_ShootingHpGauge.prototype.update = function() {
    this.updateGaugeContent();
}

Sprite_ShootingHpGauge.prototype.getColor = function(index) {
    switch(index) {
        case 0:
            return "rgb(255,255,0)";
        case 1:
            return "rgb(0,255,0)";
        case 2:
            return "rgb(0,255,255)";
    }
    if (index >= 3) {
        return "rgb(255,255,255)";
    }
    return null;
}

Sprite_ShootingHpGauge.prototype.updateGaugeContent = function() {
    if (this._lastValue != this._gaugeFunc()) {
        this._lastValue = this._gaugeFunc();
        this._gaugeSprite.bitmap.clear();
        var index = -1;
        if (this._type) {
            index = Math.floor(this._lastValue / 1000);
        } else {
            index = Math.floor(this._lastValue / 2000);
        }
        var fore = this.getColor(index);
        var back = this.getColor(index-1);
        var rate = 1;
        if (this._type) {
            rate = ((this._lastValue) % 1000) / 1000;
        } else {
            rate = ((this._lastValue) % 2000) / 2000;
        }
        this._gaugeSprite.bitmap.fillRect(0,0,this._gaugeSprite.width, this._gaugeSprite.height, fore);
        if (back) {
            this._gaugeSprite.bitmap.fillRect(0,0,this._gaugeSprite.width, this._gaugeSprite.height * (1-rate), back);
        } else {
            this._gaugeSprite.bitmap.clearRect(0,0, this._gaugeSprite.width, this._gaugeSprite.height * (1-rate));
        }
    }
}

//-----------------------------------------------------------------------------
// Sprite_ShootingScore
//
// The sprite for displaying score.

function Sprite_ShootingScore() {
    this.initialize.apply(this, arguments);
}

Sprite_ShootingScore.prototype = Object.create(Sprite_Base.prototype);
Sprite_ShootingScore.prototype.constructor = Sprite_ShootingScore;

Sprite_ShootingScore.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this._lastNearmiss = false;
    this._nearmissCount = 0;
    this._lastScore = -1;
    this._stringWidth = -1;
    this._scoreWidth = -1;
    this.createNearmissSprite();
    this.createBitmap();
}

Sprite_ShootingScore.prototype.createNearmissSprite = function() {
    this._nearmissSprite = new Sprite();
    this._nearmissSprite.bitmap = new Bitmap(ImageManager.loadEmptyBitmap().measureTextWidth("NEARMISS!"), 30);
    this._nearmissSprite.bitmap.drawText("NEARMISS!",0,0,this._nearmissSprite.bitmap.width, 30);
    this._nearmissSprite.opacity = 0;
    this.addChild(this._nearmissSprite);
}

Sprite_ShootingScore.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(128, 30);
    this._titleSprite = new Sprite();
    this._titleSprite.bitmap = new Bitmap(128,30);
    this._titleSprite.bitmap.drawText("Score",0,0,128,30,"center");
    this._stringWidth = this.bitmap.measureTextWidth("Score");
    this._titleSprite.y = -30;
    this.addChild(this._titleSprite);
}

Sprite_ShootingScore.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this.updateBitmap();
    this.updateEffect();
    this.updateNearmiss();
}

Sprite_ShootingScore.prototype.updateBitmap = function() {
    if ($gameSystem._shootingRPGScore != this._lastScore) {
        this._lastScore = $gameSystem._shootingRPGScore;
        this.bitmap.clear();
        this.bitmap.drawText(Math.round(this._lastScore).toString(),0,0,128,30,"center");
        this._scoreWidth = this.bitmap.measureTextWidth(Math.round(this._lastScore).toString());
        this.scale.x = 1.3;
        this.scale.y = 1.3;
    }
}

Sprite_ShootingScore.prototype.updateEffect = function() {
    if (Math.abs(this.scale.x - 1) >= 0.001) {
        this.scale.x *= 0.9;
        this.scale.y *= 0.9;
        if ((this.scale.x - 1) <= 0.001) {
            this.scale.x = 1;
            this.scale.y = 1;
        }
    }
}

Sprite_ShootingScore.prototype.updateNearmiss = function() {
    this._nearmissSprite.x = Math.max(this._stringWidth, this._scoreWidth) + this._nearmissSprite.width/2;
    this._nearmissSprite.y = -15;
    if ($gameSystem._shootingRPGNearmiss != this._lastNearmiss) {
        if (!this._lastNearmiss) {
            this._nearmissSprite.opacity = 255;
            this._nearmissCount = 15;
        }
        this._lastNearmiss = $gameSystem._shootingRPGNearmiss;
    }
    if (!this._lastNearmiss && this._nearmissCount != 0) {
        this._nearmissSprite.opacity = 255 * (this._nearmissCount / 15);
        this._nearmissCount--
        if (this._nearmissCount == 0) {
            this._nearmissSprite.opacity = 0;
        }
    }
}

//-----------------------------------------------------------------------------
// Spriteset_Shooting
//
// The set of sprites on the map screen.

function Spriteset_Shooting() {
    this.initialize.apply(this, arguments);
}

Spriteset_Shooting.prototype = Object.create(Spriteset_Map.prototype);
Spriteset_Shooting.prototype.constructor = Spriteset_Shooting;

Spriteset_Shooting.prototype.initialize = function() {
    Spriteset_Map.prototype.initialize.call(this);
};

Spriteset_Shooting.prototype.createUpperLayer = function() {
    Spriteset_Map.prototype.createUpperLayer.call(this);
    this.createScoreSprite();
};

Spriteset_Shooting.prototype.createScoreSprite = function() {
    this._scoreSprite = new Sprite_ShootingScore();
    this._scoreSprite.x = 30;
    this._scoreSprite.y = 60;
    this.addChild(this._scoreSprite);
}

Spriteset_Shooting.prototype.createCharacters = function() {
    this._characterSprites = [];
    $gameMap.events().filter(function(e) {
        return !e.event().meta["EnemyIndex"] && !e.event().meta["PlayerPosition"];
    }).forEach(function(event) {
        this._characterSprites.push(new Sprite_Character(event));
    }, this);
    $gameMap.vehicles().forEach(function(vehicle) {
        this._characterSprites.push(new Sprite_Character(vehicle));
    }, this);
    this._characterSprites.push(new Sprite_ShootingPlayer());
    for (var i = 0; i < this._characterSprites.length; i++) {
        this._tilemap.addChild(this._characterSprites[i]);
    }
    this.createBattlers();
};

Spriteset_Shooting.prototype.createBattlers = function() {
    this._battlerSprites = [];
    for (var i = 0; i < BattleManager.enemies.length; i++) {
        this._battlerSprites.push(new Sprite_ShootingEnemy(BattleManager.enemies[i]));
    }
    this._battlerSprites.push(new Sprite_ShootingExtra());
    for (var n = 0; n < this._battlerSprites.length; n++) {
        this.addChild(this._battlerSprites[n]);
    }
    this._playerGauge = new Sprite_ShootingHpGauge(BattleManager.playerHp, true);
    this._enemyGauge = new Sprite_ShootingHpGauge(BattleManager.enemyHp, false);
    this.addChild(this._playerGauge);
    this.addChild(this._enemyGauge);

}

//-----------------------------------------------------------------------------
// Scene_BattleShooting
//
// The scene class of the battle screen.

function Scene_BattleShooting() {
    this.initialize.apply(this, arguments);
}

Scene_BattleShooting.prototype = Object.create(Scene_Base.prototype);
Scene_BattleShooting.prototype.constructor = Scene_BattleShooting;

Scene_BattleShooting.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._pause = false;
    this._touchCount = 0;
    this._touchPoint = null;
};

Scene_BattleShooting.prototype.isReady = function() {
    if (!this._mapLoaded && DataManager.isMapLoaded()) {
        this.onMapLoaded();
        this._mapLoaded = true;
    }
    return this._mapLoaded && Scene_Base.prototype.isReady.call(this);
};

Scene_BattleShooting.prototype.onMapLoaded = function() {
    $gameMap = BattleManager._shootingMap;
    $gamePlayer = BattleManager._shootingPlayer;
	BattleManager._shootingMap.setup($gameSystem._shootingRPGBattleMapId);
    BattleManager.createBattlers();
    this.createDisplayObjects();
};

Scene_BattleShooting.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    this.startFadeIn(this.fadeSpeed(), false);
    BattleManager.playBattleBgm();
    BattleManager.startBattle();
};

Scene_BattleShooting.prototype.update = function() {
    this.updatePause();
    if (this._pause) {
        return;
    }
    var active = this.isActive();
    this.updateMapTouch();
    BattleManager.update();
    $gameMap.update(active);
    $gamePlayer.update(active);
    $gameTimer.update(active);
    $gameScreen.update();
    Scene_Base.prototype.update.call(this);
};

Scene_BattleShooting.prototype.updateMapTouch = function() {
    if (Imported.Kien_MultiTouchSupport) {
        Scene_Map.prototype.processMapTouch.call(this);
        return;
    }
    if (TouchInput.isTriggered() || this._touchCount > 0) {
        if (TouchInput.isPressed()) {
            if (this._touchCount === 0 || this._touchCount >= 3) {
                var x = $gameMap.canvasToMapX(TouchInput.x);
                var y = $gameMap.canvasToMapY(TouchInput.y);
                $gameTemp.setDestination(x, y);
            }
            this._touchCount++;
        } else {
            this._touchCount = 0;
        }
    }
};

Scene_BattleShooting.prototype.updatePause = function() {
    if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
        this._pause = !this._pause;
        SoundManager.playCancel();
    }
}

Scene_BattleShooting.prototype.stop = function() {
    Scene_Base.prototype.stop.call(this);
    if (this.needsSlowFadeOut()) {
        this.startFadeOut(this.slowFadeSpeed(), false);
    } else {
        this.startFadeOut(this.fadeSpeed(), false);
    }
};

Scene_BattleShooting.prototype.needsSlowFadeOut = function() {
    return (SceneManager.isNextScene(Scene_Title) ||
            SceneManager.isNextScene(Scene_Gameover));
};

Scene_BattleShooting.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
    $gameParty.onBattleEnd();
    $gameTroop.onBattleEnd();
    AudioManager.stopMe();
};


Scene_BattleShooting.prototype.createDisplayObjects = function() {
    this.createSpriteset();
    this.createWindowLayer();
    this.createAllWindows();
};

Scene_BattleShooting.prototype.createSpriteset = function() {
    this._spriteset = new Spriteset_Shooting();
    this.addChild(this._spriteset);
};

Scene_BattleShooting.prototype.createAllWindows = function() {
    this.createMessageWindow();
    this.createScrollTextWindow();
};

Scene_BattleShooting.prototype.createMessageWindow = function() {
    this._messageWindow = new Window_Message();
    this.addWindow(this._messageWindow);
    this._messageWindow.subWindows().forEach(function(window) {
        this.addWindow(window);
    }, this);
};

Scene_BattleShooting.prototype.createScrollTextWindow = function() {
    this._scrollTextWindow = new Window_ScrollText();
    this.addWindow(this._scrollTextWindow);
};

Scene_BattleShooting.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
    BattleManager.revertGameObject();
    $gameParty.onBattleEnd();
    $gameTroop.onBattleEnd();
    AudioManager.stopMe();
};

Kien.ShootingRPG.Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
    if (Kien.ShootingRPG.enableDefault) {
        if (DataManager.isBattleTest()) {
            DataManager.setupBattleTest();
            SceneManager.goto(Scene_BattleShooting);
            this.updateDocumentTitle();
            return;
        }
    }
    Kien.ShootingRPG.Scene_Boot_start.call(this);
};

Kien.ShootingRPG.Scene_Map_updateEncounter = Scene_Map.prototype.updateEncounter;
Scene_Map.prototype.updateEncounter = function() {
    if ($gameSystem._shootingRPGEnabled) {
        if ($gamePlayer.executeEncounter()) {
           SceneManager.push(Scene_BattleShooting);
        }
    } else {
        Kien.ShootingRPG.Scene_Map_updateEncounter.call(this);
    }
};

Scene_Map.prototype.isFastForward = function() {
    return false;
};