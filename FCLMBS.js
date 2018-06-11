//=============================================================================
// FCLMBS
// FCLMBS.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_FCLMBS = true;

var Kien = Kien || {};
Kien.FCLMBS = {};
//=============================================================================
/*:
 * @plugindesc FCLMBS - Free Chain Linear Motion Battle System.
 * @author Kien
 *
 *
 * @param Max TP
 * @desc Maximum of TP in default.
 * @default 10000
 * @type number
 * @min 100
 * @max 1000000
 * @decimals 1
 *
 * @param TP Consumption Mitigation Formula
 * @desc formula used to calculate actual tp consumption after
 * the effect of TP Mitigation. tpv refers to param, btc refers to base comsumption.
 * @default (1 - (tpv / (tpv + 200))) * 27
 *
 * @param TP Regeneration Formula
 * @desc regeneration amount of tp in each frame.
 * tpr referes to param.
 * @default (50 * ((tpr + 100) / 100))
 * 

 */

Kien.FCLMBS.parameters = PluginManager.parameters("FCLMBS");
Kien.FCLMBS.maxTp = parseInt(Kien.FCLMBS.parameters["Max TP"],10);
Kien.FCLMBS.tpConsumptionFormula = (Kien.FCLMBS.parameters["TP Consumption Mitigation Formula"]);
Kien.FCLMBS.tpRegenerationFormula = (Kien.FCLMBS.parameters["TP Regeneration Formula"]);

//-----------------------------------------------------------------------------
// Game_LMBSAiActorBase
//
// Ai Action use Magic Skills at a certain position.
// What this action do is:
//  1. move actor to its initial position
//  2. Let him cast the skill.
//  3. Wait him finish his skill.
// and then handout the control of actor to its parent AI.

// Game_LMBSAiActorBase.prototype.update = function() {
//     if (this._battler.isMotion()) {
//         this._battler.pushAiWaitIdle();
//         if (this._battler._actions[0].isPhysical()){
//             this._battler.pushAi(Game_LMBSAiActorChainSkill);
//         }
//         return;
//     }
//     var max = this._battler._aiData.attackRate + this._battler._aiData.magicRate;
//     var ran = Math.randomInt(max);
//     if (ran < this._battler._aiData.attackRate || this._battler.magicSkills().length == 0) {
//         // When chosen the normal attack, or there have no magic skills.
//         this._battler._aiData.actionType = 'attack';
//         this._battler._aiData.readySkill = this._battler.chooseAvailableSkills(this._battler.attackSkills()).sample();
//         if (this._battler._aiData.readySkill) {
//             this._battler.chooseTarget();
//             if (this._battler._target) {
//                 var dist = Kien.LMBS_Core.getSkillRange(this._battler._aiData.readySkill);
//                 this._battler.pushAi(Game_LMBSAiActorPhysicalAction,{'dist': dist});
//             } else {
//                 this._battler.startAiIdle(false);
//             }
//         } else {
//             this._battler.startAiIdle(false);
//         }
//     } else {
//         // When chosen the magic attack.
//         this._battler._aiData.actionType = 'magic';
//         this._battler._aiData.readySkill = this._battler.chooseRandomSkill(this._battler.chooseAvailableSkills(this._battler.magicSkills()));
//         if (this._battler._aiData.readySkill) {
//             this._battler.chooseTarget();
//             if (this._battler._target){
//                 this._battler.pushAi(Game_LMBSAiActorMagicAction);
//             } else {
//                 this._battler.startAiIdle(false);
//             }
//         } else {
//             this._battler.startAiIdle(false);
//         }
//     }
// }

Kien.FCLMBS.getSkillText = function(skill) {
    if (skill) {
        return "\\I[" + skill.iconIndex + "] " + skill.name;
    } else {
        return "";
    }
}

Kien.FCLMBS.prevLoadExtraLine = Kien.LMBS_Core.loadExtraLine;
Kien.LMBS_Core.loadExtraLine = function(line, cur) {
	var list = cur.list;
	if (line.match(/SetTPConsumption (true|false)/i)) {
		list.push({
			"type" : "settpconsumption",
			"bool" : eval(RegExp.$1)
		})
	}
	Kien.FCLMBS.prevLoadExtraLine.call(line, cur);
}

//-----------------------------------------------------------------------------
// TextManager
//
// The static class that handles terms and messages.

Kien.FCLMBS.TextManager_param = TextManager.param;
TextManager.param = function(paramId) {
    if (paramId < 8) {
    	return Kien.FCLMBS.TextManager_param.apply(this, arguments);
    } else if (paramId == 8) {
    	return "命中"
    } else if (paramId == 9) {
    	return "回避"
    }
    return '';
};

//-----------------------------------------------------------------------------
// DefaultMotionDescriptor
//
// Motion descriptor for default skill motions.

DefaultMotionDescriptor.prototype.processMotionCommandsettpconsumption = function(obj) {
    this._battler._isConsumeTp = obj.bool;
}

DefaultMotionDescriptor.prototype.canUse = function(battler, obj) {
    var bool = false
    if(DataManager.isSkill(obj)){
        bool = battler.meetsSkillConditions(obj);
    } else if (DataManager.isItem(obj)){
        bool = battler.meetsItemConditions(obj);
    }
    if(!bool){
        return false;
    }
    if (!battler.isGround()) {
        bool = obj.meta["Aerial Cast"] ? true : false ;
    }
    return bool;
}

//-----------------------------------------------------------------------------
// Game_Battler
//
// The superclass of Game_Actor and Game_Enemy. It contains methods for sprites
// and actions.

Kien.FCLMBS.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers = function() {
    Kien.FCLMBS.Game_Battler_initMembers.apply(this, arguments);
    this._hpRegenStack = 0;
    this._isFinishEnable = true;
}

Game_Battler.prototype.update = function(){
    this._debugRects.clear();
    if (this._forceWaitCount > 0) {
        this._forceWaitCount--;
    }
	this.updateGravity();
    this.updateKnockback();
    this.updateGuard();
    this.updateMotion();
    if(!this.isMotion()){
        this.updatePose();
    }
    this.updateDamaging();
    this.updateJump();
    this.updateCollide();
    this.updateMoving();
    this.updateChainCount();
    this.updateTP();
};

Game_BattlerBase.prototype.maxTp = function() {
    return Kien.FCLMBS.maxTp;
};

Game_Battler.prototype.updateTP = function() {
    if (!this.isDead()) {
        if (this.isMotion()) {
            if (this._isConsumeTp) {
                var tpv = this.luk;
                var formula = Kien.FCLMBS.tpConsumptionFormula;
                var v = eval(formula);
                if (this.currentSkill().meta["FinishSkill"]) {
                    v *= 2;
                }
                var l = this.tp;
                this.gainTp(-v);
                this.tpIgnoreAmount += this.tp-l;
            }
            this._hpRegenStack += this.mmp / 600;
            if (this._hpRegenStack >= 1) {
                var v2 = Math.floor(this._hpRegenStack);
                this.gainHp(v2);
                this._hpRegenStack -= v2;
                this.hpIgnoreAmount += v2;
            }
        } else {
            var formula = Kien.FCLMBS.tpRegenerationFormula;
            var tpr = this.agi;
            var v = eval(formula);
            var l = this.tp;
            this.gainTp(v);
            this.tpIgnoreAmount += this.tp-l;
            this._hpRegenStack += this.mmp / 300;
            if (this._hpRegenStack >= 1) {
                var v2 = Math.floor(this._hpRegenStack);
                this.gainHp(v2);
                this._hpRegenStack -= v2;
                this.hpIgnoreAmount += v2;
            }
        }
    }
}

Game_Battler.prototype.initTp = function() {
    var t = this.tp;
    this.setTp(this.maxTp());
    this.tpIgnoreAmount = this.tp-t;
};

Kien.FCLMBS.Game_Battler_endMotion = Game_Battler.prototype.endMotion;
Game_Battler.prototype.endMotion = function() {
	Kien.FCLMBS.Game_Battler_endMotion.apply(this, arguments);
	this._isConsumeTp = true;
}

Game_Battler.prototype.useSkill = function(skillId){
    var skill = $dataSkills[skillId];
    if (skill && this.canUseLMBS(skill)){
        this._isFinishEnable = !this._actions[0] || !this.currentSkill().meta["FinishSkill"];
        this.endMotion();
        var action = new Game_Action(this);
        action.setSkill(skillId);
        this.setAction(0,action);
        this.loadMotionFromObject(skill);
        this.chooseCorrectTarget();
        BattleManager.refreshStatus();
    }
}
Game_Battler.prototype.updateDamaging = function() {
    if (this.isDamaging()){
        var nrect = this._damageInfo.rect;
        var attackRect = new Rectangle(nrect.x,nrect.y,nrect.width,nrect.height);
        if(this._facing){
            attackRect.x += this.screenX();
        } else {
            attackRect.x = this.screenX() - attackRect.x;
            attackRect.x -= attackRect.width;
        }
        attackRect.y += this.screenY() - attackRect.height;
        var memb = [];
        if (this.currentAction().isForFriend()){
            memb = this.friendsUnit().members();
        } else if (this.currentAction().isForOpponent()){
            memb = this.opponentsUnit().members();
        }
        for (var i = 0; i < memb.length; i++) {
        	var enemy = memb[i];
            if (enemy.isAppeared() && (this.currentAction().isForDeadFriend() == enemy.isDead()) && enemy._battleRect.overlap(attackRect)){
            	if (this._tp <= 0 && !(this.currentSkill().meta["FinishSkill"] && this._isFinishEnable)) {
            		var dir = (this._facing ? 4 : 6);
            		this.gainHp(Math.floor(this.hp * -0.1));
            		this.startDamagePopup();
            		this.knockback({"x" : 5, "y" : 5}, dir, 20);
            		break;
            	}
                this.dealDamage(enemy);
            }
        }
    }
}

//-----------------------------------------------------------------------------
// Game_LMBSAiActorChainSkill
//
// Ai Action to chain skill automatically

Game_LMBSAiActorChainSkill.prototype.update = function() {
    Game_LMBSAiBase.prototype.update.call(this);
    if (!!this._battler && !this._finish) {
            if (this._battler.isMotion()){
                if (this._battler.isWaitInput()){
                    if (this._battler.tpRate() < 0.25) {
                        this._finish = true;
                        return;
                    }
                    var avail = this._battler.chooseAvailableSkills(this._battler._availableAttacks);
                    if (avail.length > 0){
                        var skill = avail.sample();
                        this._battler.useSkill(skill.id);
                    } else {
                        var pri = Kien.LMBS_Core.getSkillPriority(this._battler._actions[0].item());
                        var highpri = this._battler.highestSkillPriority();
                        if (pri == highpri || pri < 0) {
                            this.updateAiAttackNegativePriority();
                        } else {
                            var n = 1;
                            var skill = this._battler.chooseAvailableSkills(this._battler.skills().filter(function(s) {
                                return Kien.LMBS_Core.getSkillPriority(s) == (pri + n) && this._battler.canUseLMBS(s);
                            }, this)).sample();
                            while (!skill && pri+n <= highpri){
                                n++;
                                skill = this._battler.skills().filter(function(s) {
                                return Kien.LMBS_Core.getSkillPriority(s) == (pri + n) && this._battler.canUseLMBS(s);
                                }, this).sample();
                            }
                            if (skill) {
                                this._battler.useSkill(skill.id);
                            } else {
                                this.updateAiAttackNegativePriority();
                            }
                        }
                    }
                }
            } else {
                this._finish = true;
            }
    }
}

Game_LMBSAiActorChainSkill.prototype.updateAiAttackNegativePriority = function() {
    var pri = Kien.LMBS_Core.getSkillPriority(this._battler._actions[0].item());
    if (pri != -1) {
        var skill = this._battler.chooseAvailableSkills(this._battler.skills().filter(function(s) {
            return Kien.LMBS_Core.getSkillPriority(s) == -2 && this._battler.canUseLMBS(s);
        }, this)).sample();
        if (!skill) {
            skill = this._battler.chooseAvailableSkills(this._battler.skills().filter(function(s) {
                return Kien.LMBS_Core.getSkillPriority(s) == -1 && this._battler.canUseLMBS(s);
            }, this)).sample();
        }
        if (skill) {
            this._battler.useSkill(skill.id);
        } else {
            this._finish = true;
        }
    }
}

Game_LMBSAiActorMagicAction.prototype.update = function() {
    Game_LMBSAiBase.prototype.update.call(this);
    switch (this._phase){
        case 0:// Back to initial position, and use the skill
            var tx = $gameParty.battlerPosition(this._battler);
            if (this._battler._battleX > tx) {
                this._battler.pushAi(Game_LMBSAiMoveTo, {'target': {'_battleX':tx}, 'dash' : true});
            }
            this._phase = 1;
            return;
        case 1: 
            this._battler._moveTarget = this._battler._battleX;
            this._battler._facing = (this._battler._target._battleX > this._battler._battleX);
            this._battler.useSkill(this._battler._aiData.readySkill.id);
            this._battler.startAiIdle(true);
            this._battler.pushAi(Game_LMBSAiActorChainSkill);
            this._phase = 2;
            return;
    }
}

//-----------------------------------------------------------------------------
// Game_Actor
//
// The game object class for an actor.

Kien.FCLMBS.Game_Actor_initMembers = Game_Actor.prototype.initMembers;
Game_Actor.prototype.initMembers = function() {
    this._skillChainSets = {};
    Kien.FCLMBS.Game_Actor_initMembers.apply(this, arguments);
}

Game_Actor.prototype.updateInputSkill = function() {
}

// each class can provide 8 params.
// so lets set another class for each character for extra settings.
Game_Actor.prototype.classForParam = function() {
	if (this.actor().meta["ParamClass"]) {
		return $dataClasses[this.actor().meta["ParamClass"]];
	}
	return null;
}

Kien.FCLMBS.Game_Actor_paramBase = Game_Actor.prototype.paramBase;
Game_Actor.prototype.paramBase = function(paramId) {
	if (paramId < 8) {
		return Kien.FCLMBS.Game_Actor_paramBase.apply(this, arguments);
	} else {
		if (this.classForParam()) {
			return this.classForParam().params[paramId - 8][this._level];
		}
	}
	return 0;
}

Kien.FCLMBS.Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
Game_Actor.prototype.paramPlus = function(paramId) {
	if (paramId < 8) {
		return Kien.FCLMBS.Game_Actor_paramPlus.apply(this, arguments);
	}
    var value = Game_Battler.prototype.paramPlus.call(this, paramId);
    var equips = this.equips();
    for (var i = 0; i < equips.length; i++) {
        var item = equips[i];
        if (item && item.meta["Param"+paramId]) {
            value += parseInt(item.meta["Param"+paramId], 10);
        }
    }
    return value;
};

Game_Actor.prototype.updateInputData = function() {
    if (this._inputData.reservedInput != null && this._inputData.inputKeepTime > 0) {
        this._inputData.inputKeepTime--;
        if (this._inputData.inputKeepTime == 0) {
            this._inputData.reservedInput = null;
            this._inputData.inputKeepTime = -1;
        }
    }
    if (this.isKnockback()) {
        this._inputData.reservedInput = null;
    } else if (Input.isTriggered('ok')) {
        this._inputData.reservedInput = 'ok';
        this._inputData.reservedInputDir = Input.dir4;
        this._inputData.inputKeepTime = Kien.LMBS_Core.inputKeepTime;
    } else if (Input.isPressed('LMBSguard')) {
        this._inputData.reservedInput = 'LMBSguard';
        this._inputData.inputKeepTime = Kien.LMBS_Core.inputKeepTime;
    }
    if (Input.dir4 != 0) {
        this._inputData.movementReservedInputDir = Input.dir4;
        if (Input.isPressed("up")) {
        } else if (Input.isTriggered("left")) {
            this._inputData.movementReservedInput = "left";
        } else if (Input.isTriggered("right")) {
            this._inputData.movementReservedInput = "right";
        } else {
            this._inputData.movementReservedInput = "move";
        }
    }
    if (Input.isTriggered("LMBSprevioustarget")) {
        this._inputData.utilInput = "ptarget";
    } else if (Input.isTriggered("LMBSnexttarget")) {
        this._inputData.utilInput = "ntarget";
    }
}

Game_Actor.prototype.useNormalAttack = function(dir) {
	if (dir == 0) {
		dir = 8;
	}
	if ([2,4,6,8].contains(dir)) {
	    var id = this._attackSets[dir.toString()];
	    if(id > 0){
	        this.useSkill(id);
	    } else {
	    	id = this._autoSelectSkill();
	    	if (id > 0) {
	    		this.useSkill(id);
	    	}
	    }
	}
}

Kien.FCLMBS.Game_Actor_chooseAvailableSkills = Game_Actor.prototype.chooseAvailableSkills;
Game_Actor.prototype.chooseAvailableSkills = function(skills) {
    return Kien.FCLMBS.Game_Actor_chooseAvailableSkills.apply(this, arguments).filter(function(skill){
        return (!skill.meta["FinishSkill"] || this.tpRate() < 0.4);
    }, this);
}

Game_Actor.prototype._autoSelectSkill = function() {
    if (this._skills) {
        var skill = this.chooseAvailableSkills(this.skills()).filter(function(s) {
            for (var i = 0; i < 4; i++) {
                if (this._attackSets[(i+1)*2] == s.id) {
                    return false;
                }
            };
            return true;
        }, this).sample();
        if (!skill) {
            skill = this.chooseAvailableSkills(this.skills()).sample();
        }
        return skill ? skill.id : 0;
    }
    return 0;
}

Game_Actor.prototype.loadAttackSkills = function(skill) {
    this._attackSets = {};
    this._autoSelected = [];
    this._availableAttacks = [];
    if(skill){
    	var set = this._skillChainSets[skill.id];
    	if (!set) {
    		set = {};
    	}
		var arr = ["2","4","6","8"];
		for (var i = 0; i < arr.length; i++) {
			var dir = arr[i];
			var id = set[dir];
			if (id && id > 0) {
				this._attackSets[dir] = id;
				this._availableAttacks.push($dataSkills[id]);
			} else {
				id = this._autoSelectSkill();
                this._attackSets[dir] = id;     
                if (id > 0) {
                    this._availableAttacks.push($dataSkills[id]);
                    this._autoSelected.push(i);
                }
			}
		}
    }
}

Game_Actor.prototype.initAttackSkills = function() {
	this.loadDefaultAttackSkill();
}

Game_Actor.prototype.loadDefaultAttackSkill = function() {
    this._attackSets = {};
    this._autoSelected = [];
    this._availableAttacks = [];
	var set = this._skillChainSets[0];
	if (!set) {
		set = {};
	}
	var arr = ["2","4","6","8"];
	for (var i = 0; i < arr.length; i++) {
		var dir = arr[i];
		var id = set[dir];
		if (id > 0) {
			this._attackSets[dir] = id;
			this._availableAttacks.push($dataSkills[id]);
		} else {
			id = this._autoSelectSkill();
			this._attackSets[dir] = id;
            if (id > 0) {
                this._availableAttacks.push($dataSkills[id]);
                this._autoSelected.push(i);
            }
		}
	}
}

Game_Actor.prototype.update = function() {
    Game_Battler.prototype.update.call(this);
    if (BattleManager.isBattleEnd() || !this._battleStart) {
        this._battleStart = false;
        return;
    }
    if (!this.isDead()) {
        if (this.isPlayerActor() && !this.isAiForcing()) {
            this.updateInputData();
            this.updateInputGuard();
            this.updateInputAttack();
            this.updateInputSkill();
            this.updateInputTarget();
            if (!this.isMotion() && !this.isGuard()) {
                this.updateInputDash();
                if(this._inputData.lastDir != 0){
                    this._inputData.lastDirPast++;
                    if (this._inputData.lastDirPast > Kien.LMBS_Core.doubleTapDur){
                        this._inputData.lastDir = 0;
                        this._inputData.lastDirPast = 0;
                    }
                }
                this.updateInputJump();
                this.updateInputMovement();
            }
        } else if (((this.isAiActing() && !this.isPlayerActor()) || this.isAiForcing())) {
            this.updateAi();
        } else if (!this.isAiActing()) {
            this.clearAiData();
        }
    }
}

//-----------------------------------------------------------------------------
// Window_BattleStatusLMBS
//
// Window Use to show Battler Status.

Window_BattleStatusLMBS.sw = 144;
Window_BattleStatusLMBS.sh = 144;

Window_BattleStatusLMBS.prototype.initialize = function() {
	var sh = 125;
	var sw = 125;;
    var h = sh;
    var w = sw * 2;
    var x = (Graphics.boxWidth - w) / 2;
    var y = Graphics.boxHeight - h;
    Window_Selectable.prototype.initialize.call(this,x,y,w,h);
    this.deactivate();
    this.width = w;
    this.height = h;
    this.y = y;
    this.x = x;
    //this.backOpacity = 0;
    this.opacity = 0;
    this.sprites = [];
    this._cursorVisible = true;
    this.createContents();
    this.createSprites();
    this.refresh();
};

Window_BattleStatusLMBS.prototype.maxCols = function() {
    return 2;
};

Window_BattleStatusLMBS.prototype.createSprites = function() {
    for (var i = 0; i < this.maxItems(); i++) {
        var actor = $gameParty.battleMembers()[i];
        this.sprites[i] = new Sprite_RingGaugeLMBS(actor);
        //this.sprites[i].ringFilter.enabled = false;
        this.sprites[i].x = this.itemRect(i).x;
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
            this._gaugeSprites[i] = new Sprite_GaugeLMBS(actor, 115, 10, pl, plm, pil, cl);
            //this.sprites[i].ringFilter.enabled = false;
            this._gaugeSprites[i].x = 5 + this.itemRect(i).x;
            this._gaugeSprites[i].y = this.sprites[i].height-10*2;
            this._gaugeSprites[i].refresh();
            this.addChild(this._gaugeSprites[i]);
        }
    }
    this.cursorSprite = new Sprite_TargetArrow();
    this.addChild(this.cursorSprite);
}

Window_BattleStatusLMBS.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    rect.width = 125;
    rect.x = 125 * index ;//+ (this.contents.width / this.maxCols() - 144) / 2;
    rect.height = this.height;
    return rect;
}

Window_BattleStatusLMBS.prototype.drawItem = function(index) {
    var actor = $gameParty.battleMembers()[index];
    this.clearItem(index);
    var tw = Graphics.boxWidth / this.maxCols();
    var tx = tw * index + 15;
    this.drawFaceToBitmap(this.sprites[index].bitmap, actor.faceName(), actor.faceIndex(), 0, 0, 125, 125);
}


Window_BattleStatusLMBS.prototype.updateCursor = function() {
    this.setCursorRect(0, 0, 0, 0);
    if (this.cursorSprite) {
        if(this.active) {
            var sp = this.sprites[this.index()];
            if (sp) {
                this.cursorSprite.x = sp.x + (sp.width) / 2;
                this.cursorSprite.y = sp.y - this.cursorSprite.height + 32;
                this.cursorSprite.visible = true;
            } else {
                this.cursorSprite.visible = false;
            }
        } else {
            this.cursorSprite.visible = false;
        }
    }
};

//-----------------------------------------------------------------------------
// Window_SkillConfig
//
// The window for Showing How the skill is asigned to each key.

Window_SkillConfig.prototype.makeCommandList = function() {
    if (!this._actor){
        return;
    }
    var lsit = [];
    var string = [];
    list = ["2","4","6","8"];
    strings = ["↓X","←X","→X","↑X"];
    for (var index = 0;index < list.length; index++) {
        this.addCommand(strings[index],'skill',true,list[index]);
    }
};

Window_SkillType.prototype.makeCommandList = function() {
    Kien.LMBS_Core.Window_SkillType_makeCommandList.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Window_FCLMBSSkillList
//
// The window for selecting a skill on the skill screen.

function Window_FCLMBSSkillList() {
    this.initialize.apply(this, arguments);
}

Window_FCLMBSSkillList.prototype = Object.create(Window_SkillList.prototype);
Window_FCLMBSSkillList.prototype.constructor = Window_FCLMBSSkillList;

Window_FCLMBSSkillList._randomItem = {
    "name" : "おまかせ",
    "iconIndex" : 89,
    "id" : 0,
    "description" : "習得したスキルからランダムにスキルを選択して使用します。"
}

Window_FCLMBSSkillList._defaultItem = {
    "name" : "初期状態",
    "iconIndex" : 89,
    "id" : 0,
    "description" : "連携の最初に使用するスキルを選択します。"
}

Window_FCLMBSSkillList.prototype.initialize = function(x, y, width, height) {
    Window_SkillList.prototype.initialize.call(this, x, y, width, height);
    this._mode = "src"
};

Window_FCLMBSSkillList.prototype.maxItems = function() {
    return this._data ? this._data.length : 1;
};

Window_FCLMBSSkillList.prototype.item = function() {
    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
};

Window_FCLMBSSkillList.prototype.isCurrentItemEnabled = function() {
    return this.isEnabled(this._data[this.index()]);
};

Window_FCLMBSSkillList.prototype.includes = function(item) {
    return !!item;
};

Window_FCLMBSSkillList.prototype.isEnabled = function(item) {
    return this._actor;
};

Window_FCLMBSSkillList.prototype.makeItemList = function() {
    if (this._actor) {
        this._data = this._actor.skills().filter(function(item) {
            return this.includes(item);
        }, this);
        if (this._mode == "src") {
            this._data.unshift(Window_FCLMBSSkillList._defaultItem);
        } else {
            this._data.unshift(Window_FCLMBSSkillList._randomItem);
        }
    } else {
        if (this._mode == "src") {
            this._data = [Window_FCLMBSSkillList._defaultItem];
        } else {
            this._data = [Window_FCLMBSSkillList._randomItem];
        }
    }
};

Window_FCLMBSSkillList.prototype.selectLast = function() {
    var skill;
    if ($gameParty.inBattle()) {
        skill = this._actor.lastBattleSkill();
    } else {
        skill = this._actor.lastMenuSkill();
    }
    var index = this._data.indexOf(skill);
    this.select(index >= 0 ? index : 0);
};

Window_FCLMBSSkillList.prototype.drawItem = function(index) {
    var skill = this._data[index];
    if (skill) {
        var costWidth = this.costWidth();
        var rect = this.itemRect(index);
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(skill));
        this.drawItemName(skill, rect.x, rect.y, rect.width - costWidth);
        this.changePaintOpacity(1);
    }
};

Window_FCLMBSSkillList.prototype.costWidth = function() {
    return this.textWidth('000');
};

Window_FCLMBSSkillList.prototype.updateHelp = function() {
    this.setHelpWindowItem(this.item());
};

Window_FCLMBSSkillList.prototype.refresh = function() {
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
};

//-----------------------------------------------------------------------------
// Window_MenuCommand
//
// The window for selecting a command on the menu screen.

Window_MenuCommand.prototype.addMainCommands = function() {
    var enabled = this.areMainCommandsEnabled();
    if (this.needsCommand('item')) {
        this.addCommand(TextManager.item, 'item', enabled);
    }
    if (this.needsCommand('skill')) {
        this.addCommand(TextManager.skill, 'skill', enabled);
        this.addCommand("セッティング", 'skillsetting', enabled);
    }
    if (this.needsCommand('equip')) {
        this.addCommand(TextManager.equip, 'equip', enabled);
    }
    if (this.needsCommand('status')) {
        this.addCommand(TextManager.status, 'status', enabled);
    }
};
//-----------------------------------------------------------------------------
// Window_EquipCommand
//
// The window for selecting a command on the equipment screen.

Window_BattleCommandLMBS.prototype.makeCommandList = function() {
    this.addCommand("セッティング", 'setting', true, Kien.LMBS_Core.battleSkillIcon);
    this.addCommand(Kien.LMBS_Core.battleSkillName, 'skill', true, Kien.LMBS_Core.battleSkillIcon);
    this.addCommand(Kien.LMBS_Core.battleItemName, 'item', true, Kien.LMBS_Core.battleItemIcon);
};

//-----------------------------------------------------------------------------
// Sprite_RingGaugeLMBS
//
// The sprite for displaying HP gauge in ring shape.
// Not usable when RingGauge.js is not added.

Sprite_RingGaugeLMBS.prototype.initialize = function(battler) {
    Sprite_Base.prototype.initialize.call(this);
    this.battler = battler;
    this._propertyList = ['hp','tp',];
    this._propertyMaxList = ['mhp','maxTp',];
    this._propertyIgnoreList = ['hpIgnoreAmount', 'tpIgnoreAmount'];
    this._colorList = ['greenyellow','red','green','yellow','red','orange'];
    this._gaugeWidth = 30
    this._gaugeEdgeWidth = 3;
    this.initializeProperties();
    this.createBitmap();
    this.createGaugeBitmap();
    this.createRingFilter();
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
    this.ringFilter.startRadius = 0.34;
    this.ringFilter.endRadius = 0.34 + 0.05 * this._current.length;
    this.ringFilter.endRadian = Math.PI * 2.75;
    this.ringFilter.startRadian = Math.PI * 1.5;
    this.filters = [this.ringFilter];
}

//-----------------------------------------------------------------------------
// Scene_SkillConfig
//
// The scene class for 

Scene_SkillConfig.prototype.onItemOk = function() {
    this.actor().setLastMenuSkill(this.item());
    var ext = this._skillConfigWindow.currentExt();
    if (ext){
        this.actor()._skillSets[ext] = this.item().id;
        this._skillConfigWindow.refresh();
    }
    this.onItemCancel();
};

//-----------------------------------------------------------------------------
// Scene_Menu
//
// The scene class of the menu screen.

Kien.FCLMBS.Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    Kien.FCLMBS.Scene_Menu_createCommandWindow.apply(this, arguments);
    this._commandWindow.setHandler('skillsetting', this.commandPersonal.bind(this));
};

Kien.FCLMBS.Scene_Menu_onPersonalOk = Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk = function() {
    switch (this._commandWindow.currentSymbol()) {
    case 'skillsetting':
        SceneManager.push(Scene_SkillSetting);
        break;
    default:
        Kien.FCLMBS.Scene_Menu_onPersonalOk.apply(this, arguments);
        break;
    }
};

//-----------------------------------------------------------------------------
// Scene_SkillSetting
//
// The scene class for configuring skill setup.

function Scene_SkillSetting() {
	this.initialize.apply(this, arguments);
};

Scene_SkillSetting.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SkillSetting.prototype.constructor = Scene_SkillSetting;

// Object to show how cursor will move when each direction key is pressed;
// 3 -1 2 
// 1 -2 0
Scene_SkillSetting._buttonKeyOrder = {
    "-2" : {
        "2" : -1,
        "8" : -1,
        "4" : 1,
        "6" : 0
    },
    "-1" : {
        "2" : -2,
        "8" : -2,
        "4" : 3,
        "6" : 2
    },
    "0" : {
        "2" : 2,
        "8" : 2,
        "4" : -2,
        "6" : 1
    },
    "1" : {
        "2" : 3,
        "8" : 3,
        "4" : 0,
        "6" : -2
    },
    "2" : {
        "2" : 0,
        "8" : 0,
        "4" : -1,
        "6" : 3
    },
    "3" : {
        "2" : 1,
        "8" : 1,
        "4" : 2,
        "6" : -1
    }
}

Scene_SkillSetting.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize.apply(this, arguments);
};

Scene_SkillSetting.prototype.create = function() {
    Scene_MenuBase.prototype.create.apply(this, arguments);
    this._selectedButtonIndex = -1;
    this.createHelpWindow();
    this.createSkillList();
    this.createStatusWindow();
    this.createSettingList();
}

Scene_SkillSetting.prototype.indexToSprite = function(i) {
    if (i == -2) {
        return this._returnButton;
    } else if (i == -1) {
        return this._srcSkillSlot;
    } else {
        return this._destSkillSlots[i];
    }
}

Scene_SkillSetting.prototype.createHelpWindow = function() {
    this._helpWindow = new Window_Help();
    this._helpWindow.deactivate();
    this.addWindow(this._helpWindow);
};

Scene_SkillSetting.prototype.createStatusWindow = function() {
    var wx = 0;
    var wy = this._helpWindow.height;
    var ww = 340;
    var wh = this._itemWindow.y - this._helpWindow.height;
    this._statusWindow = new Window_SkillStatus(wx, wy, ww, wh);
    this._statusWindow.deactivate();
    this._statusWindow.refresh = function() {
    this.contents.clear();
        if (this._actor) {
            var w = this.width - this.padding * 2;
            var h = this.height - this.padding * 2;
            var y = h / 2 - this.lineHeight() * 1.5;
            this.drawActorFace(this._actor, 0, 0, 144, h);
            this.drawActorName(this._actor, 162, y);
            this.drawActorLevel(this._actor, 162, y + this.lineHeight() * 1);
        }
    };
    this._statusWindow.reserveFaceImages();
    this.addWindow(this._statusWindow);
};

Scene_SkillSetting.prototype.createSkillList = function() {
    var wx = 0;
    var ww = Graphics.boxWidth;
    var wh = 200
    var wy = Graphics.boxHeight - wh;
    this._itemWindow = new Window_FCLMBSSkillList(wx, wy, ww, wh);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this.addWindow(this._itemWindow);
};

Scene_SkillSetting.prototype.createSettingList = function() {
    this._srcSkillSlot = new Sprite_UIButton();
    this._srcSkillSlot._skillId = 0;
    this._srcSkillSlot.select();
    this._srcSkillSlot.setClickHandler(this.onSrcSlotClick.bind(this));
    this.addChild(this._srcSkillSlot);
    this._destSkillSlots = [];
    for (var i = 0; i < 4; i++) {
        this._destSkillSlots[i] = new Sprite_UIButton();
        this._destSkillSlots[i]._skillId = this.getCorrespondSkillId(i);
        this._destSkillSlots[i].setClickHandler(this.onDestSlotClick.bind(this, i));
        this.addChild(this._destSkillSlots[i]);
    }
    this._returnButton = new Sprite_UIButton();
    this._returnButton.setText("もどる");
    this._returnButton.defaultScale.x = 0.8;
    this._returnButton.defaultScale.y = 0.8;
    this._returnButton.setClickHandler(this.onReturnButtonClick.bind(this));
    this.addChild(this._returnButton);
};

Scene_SkillSetting.prototype.getCorrespondSkillId = function(i) {
    if (this.actor()) {
        if (this.actor()._skillChainSets[this._srcSkillSlot._skillId]) {
            return this.actor()._skillChainSets[this._srcSkillSlot._skillId][(i+1)*2] || 0;
        }
    }
    return 0;
}

Scene_SkillSetting.prototype.setCorrespondSkillId = function(i) {
    if (this.actor()) {
        if (!this.actor()._skillChainSets[this._srcSkillSlot._skillId]) {
            this.actor()._skillChainSets[this._srcSkillSlot._skillId] = {};
        }
        this.actor()._skillChainSets[this._srcSkillSlot._skillId][(i+1)*2] = this._destSkillSlots[i]._skillId;
    }
    return 0;
}

Scene_SkillSetting.prototype.refreshActor = function() {
    var actor = this.actor();
    this._statusWindow.setActor(actor);
    this._itemWindow.setActor(actor);
};

Scene_SkillSetting.prototype.getActiveWindow = function() {
    return this._windowLayer.children.filter(function(win) { return win.active })[0];
}

Scene_SkillSetting.prototype.onItemSrcOk = function() {
    this._srcSkillSlot._skillId = this._itemWindow.item().id;
    this.refreshAllButtonSkill();
    this.refreshAllButtonContent();
};

Scene_SkillSetting.prototype.onItemDestOk = function() {
    var sprite = this.indexToSprite(this._selectedButtonIndex);
    sprite._skillId = this._itemWindow.item().id;
    this.setCorrespondSkillId(this._selectedButtonIndex);
    this.refreshButtonContent(this._selectedButtonIndex);
};

Scene_SkillSetting.prototype.onItemCancel = function() {
};

Scene_SkillSetting.prototype.start = function() {
    Scene_MenuBase.prototype.start.apply(this, arguments);
    this.refreshButtonPlacement();
    this.refreshAllButtonContent();
    this.refreshActor();
}

Scene_SkillSetting.prototype.refreshAllButtonSkill = function() {
    for (var i = 0; i < 4; i++) {
        this._destSkillSlots[i]._skillId = this.getCorrespondSkillId(i);
    }
}

Scene_SkillSetting.prototype.refreshButtonPlacement = function() {
    var xs = this._statusWindow.width;
    var tw = Graphics.width - xs;
    var ys = this._helpWindow.y + this._helpWindow.height;
    this._srcSkillSlot.x = xs + tw / 2;
    Kien.lib.placeSpriteAtY(this._srcSkillSlot, ys);
    this._returnButton.x = xs + tw / 2;
    Kien.lib.placeSpriteAtY(this._returnButton, this._itemWindow.y - this._returnButton.height);
    for (var i = 0; i < 4; i++) {
        Kien.lib.placeSpriteAtX(this._destSkillSlots[i], i % 2 == 0 ? Graphics.width - this._destSkillSlots[i].width : xs)
        Kien.lib.placeSpriteAtY(this._destSkillSlots[i], i < 2 ? this._itemWindow.y - this._destSkillSlots[i].height : ys);
    }
}

Scene_SkillSetting.prototype.refreshAllButtonContent = function() {
    for (var i = -1; i < 4; i++) {
        this.refreshButtonContent(i);
    }
}

Scene_SkillSetting.prototype.refreshButtonContent = function(i) {
    var sprite;
    var skill;
    if (i < 0) {
        if (this._srcSkillSlot._skillId == 0) {
            this._srcSkillSlot.setText("初期状態")
            return;
        } else {
            sprite = this._srcSkillSlot;
            skill = $dataSkills[sprite._skillId];
        }
    } else {
        sprite = this._destSkillSlots[i];
        if (sprite._skillId == 0) {
            skill = Window_FCLMBSSkillList._randomItem;
        } else {
            skill = $dataSkills[sprite._skillId];
        }
    }
    if (skill && sprite) {
        sprite.createTextSprite();
        var width = Window_Base._iconWidth + Kien.lib.emptyBitmap.measureTextWidth(skill.name) + 24;
        var height = Window_Base._iconHeight + 24;
        var text = Kien.FCLMBS.getSkillText(skill);
        sprite.setText(text);
    }
}

Scene_SkillSetting.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    this.updateInput();
}

Scene_SkillSetting.prototype.updateInput = function() {
    if (!this.getActiveWindow()) {
        var srcsprite = this.indexToSprite(this._selectedButtonIndex);
        srcsprite.select(this._selectedButtonIndex);
        var src = this._selectedButtonIndex;
        var dst = Scene_SkillSetting._buttonKeyOrder[src];
        if (Input.isRepeated("down")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[2];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("up")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[8];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("left")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[4];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("right")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[6];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isTriggered("cancel")) {
            SoundManager.playCancel();
            this.popScene();
        } else if (Input.isTriggered("ok")) {
            srcsprite.callClickHandler();
        }
    } else {
        this.indexToSprite(this._selectedButtonIndex).lock();
    }
}

Scene_SkillSetting.prototype.onSrcSlotClick = function() {
    SoundManager.playOk();
    this.indexToSprite(this._selectedButtonIndex).revert();
    this._selectedButtonIndex = -1;
    this._itemWindow._mode = "src";
    this._itemWindow.setHandler("ok", this.onItemSrcOk.bind(this));
    this._itemWindow.refresh();
    this._itemWindow.activate();
    var index = this._itemWindow._data.indexOf(this._srcSkillSlot._skillId);
    this._itemWindow.select(index >= 0 ? index : 0);
}

Scene_SkillSetting.prototype.onDestSlotClick = function(i) {
    SoundManager.playOk();
    this.indexToSprite(this._selectedButtonIndex).revert();
    this._selectedButtonIndex = i;
    this._itemWindow._mode = "dest";
    this._itemWindow.setHandler("ok", this.onItemDestOk.bind(this));
    this._itemWindow.refresh();
    this._itemWindow.activate();
    var index = this._itemWindow._data.indexOf(this.indexToSprite(this._selectedButtonIndex)._skillId);
    this._itemWindow.select(index >= 0 ? index : 0);
}

Scene_SkillSetting.prototype.onReturnButtonClick = function() {
    SoundManager.playOk();
    this.popScene();
}

Scene_SkillSetting.prototype.updateButton = function() {
}

//-----------------------------------------------------------------------------
// Scene_BattleLMBS
//
// The scene class of the battle screen.

Kien.FCLMBS.Scene_BattleLMBS_create = Scene_BattleLMBS.prototype.create;
Scene_BattleLMBS.prototype.create = function() {
	Kien.FCLMBS.Scene_BattleLMBS_create.apply(this, arguments);
	this.createTouchUI();
    this.createSkillSettingWindow();
}

Kien.FCLMBS.Scene_BattleLMBS_createMenuWindow = Scene_BattleLMBS.prototype.createMenuWindow;
Scene_BattleLMBS.prototype.createMenuWindow = function() {
    Kien.FCLMBS.Scene_BattleLMBS_createMenuWindow.apply(this, arguments);
    this._menuWindow.setHandler('setting',  this.onMenuWindowSetting.bind(this));
};

Scene_BattleLMBS.prototype.createTouchUI = function() {
	this._touchUIContainer = new Sprite();
	this.addChild(this._touchUIContainer);
	this.createMoveButton();
	this.createDefenseButton();
	this.createMenuButton();
	this.createSkillButton();
}

Scene_BattleLMBS.prototype.createMoveButton = function() {
	this._moveLeftButton = new Sprite_UIButton();
	this._moveLeftButton.setText("←");
	this._moveLeftButton.setPressHandler(this.onLeftMoveButtonTouching.bind(this));
	this._touchUIContainer.addChild(this._moveLeftButton);
	this._moveRightButton = new Sprite_UIButton();
	this._moveRightButton.setText("→");
	this._moveRightButton.setPressHandler(this.onRightMoveButtonTouching.bind(this));
	this._touchUIContainer.addChild(this._moveRightButton);
}

Scene_BattleLMBS.prototype.createDefenseButton = function() {
	this._guardButton = new Sprite_UIButton();
	this._guardButton.setText("防御");
	this._guardButton.setPressHandler(this.onGuardButtonTouching.bind(this));
	this._touchUIContainer.addChild(this._guardButton);
}

Scene_BattleLMBS.prototype.createMenuButton = function() {
	this._menuButton = new Sprite_UIButton();
	this._menuButton.setText("メニュー");
	this._menuButton.setPressHandler(this.onMenuButtonTriggered.bind(this));
	this._touchUIContainer.addChild(this._menuButton);
}

Scene_BattleLMBS.prototype.createSkillButton = function() {
	this._skillButtonContainer = new Sprite();
	this._skillButtonContainer.x = 0;
	this._skillButtonContainer.y = 0;
	this.addChild(this._skillButtonContainer);
	this._skillButton = [];
	var bh = 80;
	var bw = 100
	for (var i = 0; i < 4; i++) {
		var sprite = new Sprite_UIButton();
        sprite._skillId = -1;
        sprite.setClickHandler(this.onSkillButtonTouched.bind(this, i));
		this._skillButton[i] = sprite;
		this._skillButtonContainer.addChild(sprite);
	}
}

Scene_BattleLMBS.prototype.refreshSkillButton = function(i) {
    if (this.activeActor()) {
        var sprite = this._skillButton[i];
        var dir = (i+1)*2;
        var dirstr = ["↓","←","→","↑"][i];
        if (this.activeActor()._attackSets[dir] != sprite._skillId) {
        	var skillId = this.activeActor()._attackSets[dir];
        	sprite._skillId = skillId;
        	if (skillId > 0) {
        		var skill = $dataSkills[skillId];
        		if (skill) {
                    var text = Kien.FCLMBS.getSkillText(skill);
        			if (this.activeActor()._autoSelected.indexOf(i) >= 0) {
                        text = dirstr + ":\\C[7]" + text;
        			} else {
                        text = dirstr + ":\\C[0]" + text;
                    }
                    sprite.setText(text);
        		} else {
        			sprite.bitmap = null;        		}
        	} else {
        		sprite.setText("おまかせ");
        		sprite._textSprite.scale.x = 1;
        		sprite._textSprite.scale.y = 1;
        	}
        }
    }
}

Scene_BattleLMBS.prototype.onLeftMoveButtonTouching = function() {
	if (this.activeActor() && this.isMovable()) {
		this.activeActor()._inputData.movementReservedInput = "left";
		this.activeActor()._inputData.movementReservedInputDir = 4;
	}
}

Scene_BattleLMBS.prototype.onSkillButtonTouched = function(i) {
	if (this.activeActor() && this.isMovable()) {
		this.activeActor()._inputData.reservedInput = "ok";
		this.activeActor()._inputData.reservedInputDir = (i+1) * 2;
	}
}

Scene_BattleLMBS.prototype.onRightMoveButtonTouching = function() {
	if (this.activeActor() && this.isMovable()) {
		this.activeActor()._inputData.movementReservedInput = "right";
		this.activeActor()._inputData.movementReservedInputDir = 6;
	}
}

Scene_BattleLMBS.prototype.onGuardButtonTouching = function() {
	if (this.activeActor() && this.isMovable()) {
		this.activeActor()._inputData.reservedInput = "LMBSguard";
	}
}

Scene_BattleLMBS.prototype.onMenuButtonTriggered = function() {
	if (!this.isAnyInputWindowActive()) {
        this._menuWindow.open();
        this._menuWindow.activate();
	}
}

Scene_BattleLMBS.prototype.createStatusWindow = function() {
    this._statusWindow = new Window_BattleStatusLMBS();
    BattleManager.setStatusWindow(this._statusWindow);
    this._statusWindow.deactivate();
    this._statusWindow.setHandler('cancel',Scene_BattleLMBS.prototype.onStatusCancelMenu.bind(this));
    this.addWindow(this._statusWindow);
};

Kien.FCLMBS.Scene_BattleLMBS_start = Scene_BattleLMBS.prototype.start;
Scene_BattleLMBS.prototype.start = function() {
	Kien.FCLMBS.Scene_BattleLMBS_start.apply(this, arguments);
	// Refresh few window/sprites at this point. Cuz we don't really know when the bitmap will laoded.
	Kien.lib.placeSpriteAtX(this._moveLeftButton, 0);
	Kien.lib.placeSpriteAtY(this._moveLeftButton, Graphics.boxHeight - this._moveLeftButton.height);
	Kien.lib.placeSpriteAtX(this._moveRightButton, Graphics.boxWidth - this._moveRightButton.width);
	Kien.lib.placeSpriteAtY(this._moveRightButton, Graphics.boxHeight - this._moveRightButton.height);
	Kien.lib.placeSpriteAtX(this._guardButton, Graphics.boxWidth - this._guardButton.width);
	Kien.lib.placeSpriteAtY(this._guardButton, Graphics.boxHeight - this._moveRightButton.height - this._guardButton.height);
	Kien.lib.placeSpriteAtX(this._menuButton, 0);
	Kien.lib.placeSpriteAtY(this._menuButton, Graphics.boxHeight - this._moveLeftButton.height - this._menuButton.height);
	for (var i = 0; i < this._skillButton.length; i++) {
		var sprite = this._skillButton[i];
		Kien.lib.placeSpriteAtX(sprite, i % 2 == 1 ? sprite.width : Graphics.width - sprite.width * 2);
		Kien.lib.placeSpriteAtY(sprite, Graphics.height - (sprite.height * Math.ceil((i+1) / 2)));
		this.refreshSkillButton(i);
	}
    this.refreshButtonPlacement();
    this.refreshAllButtonContent();
    this.refreshActor();
	this._statusWindow.refresh();
	$gameParty.members().forEach(function(actor) { actor.loadDefaultAttackSkill(); });
}

Kien.FCLMBS.Scene_BattleLMBS_update = Scene_BattleLMBS.prototype.update;
Scene_BattleLMBS.prototype.update = function() {
	Kien.FCLMBS.Scene_BattleLMBS_update.apply(this, arguments);
    this.updateTouchUI();
    if (this._skillSlotSprite.visible) {
        this.updateSettingInput();
    }
}

Scene_BattleLMBS.prototype.updateSettingInput = function() {
    if (!this._skillSettingList.active) {
        var srcsprite = this.indexToSprite(this._selectedButtonIndex);
        srcsprite.select(this._selectedButtonIndex);
        var src = this._selectedButtonIndex;
        var dst = Scene_SkillSetting._buttonKeyOrder[src];
        if (Input.isRepeated("down")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[2];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("up")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[8];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("left")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[4];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isRepeated("right")) {
            SoundManager.playCursor();
            srcsprite.revert();
            this._selectedButtonIndex = dst[6];
            this.indexToSprite(this._selectedButtonIndex).select();
        } else if (Input.isTriggered("cancel")) {
            SoundManager.playCancel();
            this.onReturnButtonClick();
        } else if (Input.isTriggered("ok")) {
            srcsprite.callClickHandler();
        }
    } else {
        this.indexToSprite(this._selectedButtonIndex).lock();
    }
}

Kien.FCLMBS.Scene_BattleLMBS_isAnyInputWindowActive = Scene_BattleLMBS.prototype.isAnyInputWindowActive;
Scene_BattleLMBS.prototype.isAnyInputWindowActive = function() {

    return Kien.FCLMBS.Scene_BattleLMBS_isAnyInputWindowActive.apply(this, arguments) ||
            (this._skillSlotSprite && this._skillSlotSprite.visible);
};

Scene_BattleLMBS.prototype.updateTouchUI = function() {
	this._touchUIContainer.visible = !(BattleManager._isEventRunning || this._battleEnd || this.isAnyInputWindowActive());
    this._skillButtonContainer.visible = !(this.isAnyInputWindowActive() || this._skillSlotSprite.visible);
	//this._skillButtonContainer.visible = !(BattleManager._isEventRunning || this._battleEnd || this.isAnyInputWindowActive()) && TouchInput.isTouch();
	for (var i = 0; i < this._skillButton.length; i++) {
		this.refreshSkillButton(i);
	}
}

Scene_BattleLMBS.prototype.createSkillWindow = function() {
    this._skillConfigWindow = new Window_SkillConfig(0,0);
    this._skillConfigWindow.y = this._helpWindow.height;
    this._skillConfigWindow.hide();
    this._skillConfigWindow.deactivate();
    this._skillConfigWindow.setHandler('skill',  this.onSkillConfigOk.bind(this));
    this._skillConfigWindow.setHandler('cancel', this.onSkillConfigCancel.bind(this));
    this.addWindow(this._skillConfigWindow);
    var wx = this._skillConfigWindow.width;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth - wx;
    var wh = this._skillConfigWindow.height;
    this._skillStatusWindow = new Window_SkillStatus(wx, wy, ww, wh);
    this._skillStatusWindow.hide();
    this._skillStatusWindow.deactivate();
    this.addWindow(this._skillStatusWindow);
    this._skillTypeWindow = new Window_SkillType(0, wy);
    this._skillTypeWindow.hide();
    this._skillTypeWindow.deactivate();
    this._skillTypeWindow.height = wh;
    this._skillTypeWindow.setHandler('skill',    this.onSkillTypeOk.bind(this));
    this._skillTypeWindow.setHandler('cancel',    this.onSkillTypeCancel.bind(this));
    this.addWindow(this._skillTypeWindow);
    wx = 0;
    wy = this._skillStatusWindow.y + this._skillStatusWindow.height;
    ww = Graphics.boxWidth;
    wh = Graphics.boxHeight - wy;
    this._skillListWindow = new Window_SkillList(wx,wy,ww,wh);
    this._skillListWindow.y = this._skillConfigWindow.y+this._skillConfigWindow.height;
    this._skillListIncludeFuncSkill = this._skillListWindow.includes;
    this._skillListIncludeFuncConfig = function(item) {return !!item; };
    this._skillListEnableFuncSkill = this._skillListWindow.isEnabled;
    this._skillListEnableFuncConfig = function(item) {return true };
    this._skillListWindow.hide();
    this._skillListWindow.deactivate();
    this._skillListWindow.setHelpWindow(this._helpWindow);
    this._skillTypeWindow.setSkillWindow(this._skillListWindow);
    this.addWindow(this._skillListWindow);
};

Scene_BattleLMBS.prototype.createItemWindow = function() {
    var wy = this._helpWindow.y + this._helpWindow.height;
    var wh = Graphics.height - wy;
    this._itemListWindow = new Window_BattleItem(0,wy,Graphics.boxWidth,wh);
    this._itemListWindow.setHandler('ok', this.onItemListOk.bind(this));
    this._itemListWindow.setHandler('cancel', this.onItemListCancel.bind(this));
    this._itemListWindow.setHelpWindow(this._helpWindow);
    this._itemListWindow.hide();
    this._itemListWindow.deactivate();
    this.addWindow(this._itemListWindow);
}

Scene_BattleLMBS.prototype.createSkillSettingWindow = function() {
    // itemList
    this._selectedButtonIndex = -1;
    var wx = 0;
    var ww = Graphics.boxWidth;
    var wh = 200
    var wy = Graphics.boxHeight - wh;
    this._skillSettingList = new Window_FCLMBSSkillList(wx, wy, ww, wh);
    this._skillSettingList.setHelpWindow(this._helpWindow);
    this._skillSettingList.setHandler('cancel', this.onItemCancel.bind(this));
    this._skillSettingList.hide();
    this.addWindow(this._skillSettingList);
    // statusWindow
    var wx = 0;
    var wy = this._helpWindow.height;
    var ww = 340;
    var wh = this._skillSettingList.y - this._helpWindow.height;
    this._settingStatusWindow = new Window_SkillStatus(wx, wy, ww, wh);
    this._settingStatusWindow.deactivate();
    this._settingStatusWindow.refresh = function() {
    this.contents.clear();
        if (this._actor) {
            var w = this.width - this.padding * 2;
            var h = this.height - this.padding * 2;
            var y = h / 2 - this.lineHeight() * 1.5;
            this.drawActorFace(this._actor, 0, 0, 144, h);
            this.drawActorName(this._actor, 162, y);
            this.drawActorLevel(this._actor, 162, y + this.lineHeight() * 1);
        }
    };
    this._settingStatusWindow.reserveFaceImages();
    this._settingStatusWindow.hide();
    this._settingStatusWindow.deactivate();
    this.addWindow(this._settingStatusWindow);
    // SkillSlot
    this._skillSlotSprite = new Sprite();
    this.addChild(this._skillSlotSprite);
    this._srcSkillSlot = new Sprite_UIButton();
    this._srcSkillSlot._skillId = 0;
    this._srcSkillSlot.select();
    this._srcSkillSlot.setClickHandler(this.onSrcSlotClick.bind(this));
    this._skillSlotSprite.addChild(this._srcSkillSlot);
    this._destSkillSlots = [];
    for (var i = 0; i < 4; i++) {
        this._destSkillSlots[i] = new Sprite_UIButton();
        this._destSkillSlots[i].setClickHandler(this.onDestSlotClick.bind(this, i));
        this._skillSlotSprite.addChild(this._destSkillSlots[i]);
    }
    this._returnButton = new Sprite_UIButton();
    this._returnButton.setText("もどる");
    this._returnButton.defaultScale.x = 0.8;
    this._returnButton.defaultScale.y = 0.8;
    this._returnButton.setClickHandler(function() {
        SoundManager.playOk();
        this.onReturnButtonClick();
    }.bind(this));
    this._skillSlotSprite.addChild(this._returnButton);
    this._skillSlotSprite.visible = false;
};

Scene_BattleLMBS.prototype.getCorrespondSkillId = function(i) {
    if (this._settingActor) {
        if (this._settingActor._skillChainSets[this._srcSkillSlot._skillId]) {
            return this._settingActor._skillChainSets[this._srcSkillSlot._skillId][(i+1)*2] || 0;
        }
    }
    return 0;
}

Scene_BattleLMBS.prototype.setCorrespondSkillId = function(i) {
    if (this._settingActor) {
        if (!this._settingActor._skillChainSets[this._srcSkillSlot._skillId]) {
            this._settingActor._skillChainSets[this._srcSkillSlot._skillId] = {};
        }
        this._settingActor._skillChainSets[this._srcSkillSlot._skillId][(i+1)*2] = this._destSkillSlots[i]._skillId;
    }
    return 0;
}

Scene_BattleLMBS.prototype.indexToSprite = function(i) {
    if (i == -2) {
        return this._returnButton;
    } else if (i == -1) {
        return this._srcSkillSlot;
    } else {
        return this._destSkillSlots[i];
    }
}

Scene_BattleLMBS.prototype.onItemSrcOk = function() {
    this._srcSkillSlot._skillId = this._skillSettingList.item().id;
    this.refreshAllButtonSkill();
    this.refreshAllButtonContent();
};

Scene_BattleLMBS.prototype.onItemDestOk = function() {
    var sprite = this.indexToSprite(this._selectedButtonIndex);
    sprite._skillId = this._skillSettingList.item().id;
    this.setCorrespondSkillId(this._selectedButtonIndex);
    this.refreshButtonContent(this._selectedButtonIndex);
};

Scene_BattleLMBS.prototype.onItemCancel = function() {
};

Scene_BattleLMBS.prototype.onSrcSlotClick = function() {
    SoundManager.playOk();
    this.indexToSprite(this._selectedButtonIndex).revert();
    this._selectedButtonIndex = -1;
    this._skillSettingList._mode = "src";
    this._skillSettingList.setHandler("ok", this.onItemSrcOk.bind(this));
    this._skillSettingList.refresh();
    this._skillSettingList.activate();
    var index = this._skillSettingList._data.indexOf(this._srcSkillSlot._skillId);
    this._skillSettingList.select(index >= 0 ? index : 0);
}

Scene_BattleLMBS.prototype.onDestSlotClick = function(i) {
    SoundManager.playOk();
    this.indexToSprite(this._selectedButtonIndex).revert();
    this._selectedButtonIndex = i;
    this._skillSettingList._mode = "dest";
    this._skillSettingList.setHandler("ok", this.onItemDestOk.bind(this));
    this._skillSettingList.refresh();
    this._skillSettingList.activate();
    var index = this._skillSettingList._data.indexOf(this.indexToSprite(this._selectedButtonIndex)._skillId);
    this._skillSettingList.select(index >= 0 ? index : 0);
}

Scene_BattleLMBS.prototype.onReturnButtonClick = function() {
    this._skillSlotSprite.visible = false;
    this._helpWindow.hide();
    this._settingStatusWindow.hide();
    this._skillSettingList.hide();
    this._menuWindow.activate();
}

Scene_BattleLMBS.prototype.onMenuWindowSetting = function() {
    this._statusWindow.setHandler('ok',Scene_BattleLMBS.prototype.onStatusOkSetting.bind(this));
    this._statusWindow.setHandler('cancel',Scene_BattleLMBS.prototype.onStatusCancelMenu.bind(this));
    this._statusWindow.selectLast();
    this._statusWindow.activate();
}

// Status Window
Scene_BattleLMBS.prototype.onStatusOkSkill = function() {
    var index = this._statusWindow.index();
    var actor = $gameParty.battleMembers()[index];
    $gameParty._lastBattleActorIndexLMBS = index;
    this._helpWindow.show();
    this._skillStatusWindow.show();
    this._skillListWindow.show();
    this._skillTypeWindow.setActor(actor);
    this._skillListWindow.includes = this._skillListIncludeFuncSkill;
    this._skillListWindow.isEnabled = this._skillListEnableFuncSkill;
    this._skillListWindow.setActor(actor);
    this._skillTypeWindow.show();
    this._skillTypeWindow.activate();
    this._settingStatusWindow.setActor(actor);
}

Scene_BattleLMBS.prototype.onStatusOkItem = function() {
    $gameParty._lastBattleActorIndexLMBS = this._statusWindow.index();
    this._helpWindow.show();
    this._itemListWindow.refresh();
    this._itemListWindow.show();
    this._itemListWindow.activate();
}

Scene_BattleLMBS.prototype.onStatusOkSetting = function() {
    var index = this._statusWindow.index();
    var actor = $gameParty.battleMembers()[index];
    $gameParty._lastBattleActorIndexLMBS = index;
    this.refreshActor(actor);
    this._helpWindow.show();
    this._skillSettingList.show();
    this._settingStatusWindow.show();
    this._skillSlotSprite.visible = true;

}

Scene_BattleLMBS.prototype.onSkillTypeCancel = function() {
    this._skillTypeWindow.hide();
    this._skillListWindow.hide();
    this._helpWindow.hide();
    this._skillStatusWindow.hide();
    this._statusWindow.activate();
}

Scene_BattleLMBS.prototype.onItemListCancel = function() {
    this._helpWindow.hide();
    this._itemListWindow.hide();
    this._statusWindow.setHandler('ok',Scene_BattleLMBS.prototype.onStatusOkItem.bind(this));
    this._statusWindow.setHandler('cancel',Scene_BattleLMBS.prototype.onStatusCancelMenu.bind(this));
    this._statusWindow.activate();
}

Scene_BattleLMBS.prototype.refreshActor = function(actor) {
    this._settingActor = actor;
    this._settingStatusWindow.setActor(actor);
    this._skillSettingList.setActor(actor);
};

Scene_BattleLMBS.prototype.refreshAllButtonSkill = function() {
    for (var i = 0; i < 4; i++) {
        this._destSkillSlots[i]._skillId = this.getCorrespondSkillId(i);
    }
}

Scene_BattleLMBS.prototype.refreshButtonPlacement = function() {
    var xs = this._settingStatusWindow.width;
    var tw = Graphics.width - xs;
    var ys = this._helpWindow.y + this._helpWindow.height;
    this._srcSkillSlot.x = xs + tw / 2;
    Kien.lib.placeSpriteAtY(this._srcSkillSlot, ys);
    this._returnButton.x = xs + tw / 2;
    Kien.lib.placeSpriteAtY(this._returnButton, this._skillSettingList.y - this._returnButton.height);
    for (var i = 0; i < 4; i++) {
        Kien.lib.placeSpriteAtX(this._destSkillSlots[i], i % 2 == 0 ? Graphics.width - this._destSkillSlots[i].width : xs)
        Kien.lib.placeSpriteAtY(this._destSkillSlots[i], i < 2 ? this._skillSettingList.y - this._destSkillSlots[i].height : ys);
    }
}

Scene_BattleLMBS.prototype.refreshAllButtonContent = function() {
    for (var i = -1; i < 4; i++) {
        this.refreshButtonContent(i);
    }
}

Scene_BattleLMBS.prototype.refreshButtonContent = function(i) {
    var sprite;
    var skill;
    if (i < 0) {
        if (this._srcSkillSlot._skillId == 0) {
            this._srcSkillSlot.setText("初期状態")
            return;
        } else {
            sprite = this._srcSkillSlot;
            skill = $dataSkills[sprite._skillId];
        }
    } else {
        sprite = this._destSkillSlots[i];
        if (sprite._skillId == 0) {
            skill = Window_FCLMBSSkillList._randomItem;
        } else {
            skill = $dataSkills[sprite._skillId];
        }
    }
    if (skill && sprite) {
        sprite.createTextSprite();
        var width = Window_Base._iconWidth + Kien.lib.emptyBitmap.measureTextWidth(skill.name) + 24;
        var height = Window_Base._iconHeight + 24;
        var text = Kien.FCLMBS.getSkillText(skill);
        sprite.setText(text);
    }
}
