//=============================================================================
// Auto SelfSwitch Reset
// AutoSelfSwitchReset.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_AutoSelfSwitchReset = true;

var Kien = Kien || {};
Kien.ASSR = {};

//=============================================================================
/*:
 * @plugindesc Allow to set selfswitches to be automatically reset.
 * @author Kien
 * @help
 * ============================================================================
 * * How to Use
 * ============================================================================
 * Add a comment that contains following string in a event.
 * <ResetSelfSwitch [ABCD]>
 * [ABCD] is any combination of self switchs name.
 * ============================================================================
 * * End of Document (English Document)
 * ============================================================================
*/

Game_Map.prototype.resetSelfSwitches = function() {
	this.events().forEach(function(event) {
		var string = event.allComments();
		var regexp = /<ResetSelfSwitch ([ABCD]+)>/g;
		var ret;
		while (ret = regexp.exec(string)) {
			var c = ret[1];
			var mapid = event._mapId;
			var eid = event._eventId;
			for (var ci = 0; ci < c.length; ci++) {
				var key = [mapid, eid, c[ci]];
				$gameSelfSwitches.setValue(key, false);
			}
		}
	});

}

Kien.ASSR.Scene_Map_create = Scene_Map.prototype.create;
Scene_Map.prototype.create = function() {
	if ($gamePlayer.isTransferring() && !!$dataMap) {
		$gameMap.resetSelfSwitches();
	}
	Kien.ASSR.Scene_Map_create.apply(this, arguments);
};
