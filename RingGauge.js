//=============================================================================
// Ring Gauge
// RingGauge.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_RingGauge = true;

var Kien = Kien || {};
Kien.RingGauge = {};
//=============================================================================
/*:
 * @plugindesc Add a custom shader to make ring shaped gauge.
 * @author Kien
 *
 */

Kien.RingGauge.RingFilter = function() {
	this.initialize.apply(this, arguments);
}

Kien.RingGauge.RingFilter.prototype = Object.create(PIXI.Filter.prototype);
Kien.RingGauge.RingFilter.prototype.constructor = Kien.RingGauge.RingFilter;

Kien.RingGauge.RingFilter._FragmentShader = 
'    const float PI = 3.1415926535897932384626433832795;'+
'    precision mediump float;'+
'    '+
'    varying vec2 vTextureCoord;'+
'    uniform sampler2D uSampler;'+
'    uniform mat3 mappedMatrix;'+
'    '+
'    uniform float startRadius;'+
'    uniform float endRadius;'+
'    uniform float startRadian;'+
'    uniform float endRadian;'+
'    uniform float cx;'+
'    uniform float cy;'+
'    uniform sampler2D gauge;'+
'    '+
'    void main(void) {'+
'      vec4 color = texture2D(uSampler, vTextureCoord);'+
'      vec2 cur = (vec3(vTextureCoord, 1.0) * mappedMatrix).xy;'+
'      float dist = distance(cur, vec2(cx,cy));'+
'      if (dist > startRadius && dist < endRadius) {'+
'        vec2 a = normalize(vec2(cx,cy)-cur);'+
'        vec2 b = vec2(1.0,0);'+
'        float det = a.x*b.y-a.y*b.x;'+
'        float rad = atan(det, dot(a,b)) + PI;'+
'        bool isCounterClockWise = false;'+
'        float start = startRadian;'+
'        float end = endRadian;'+
'        if (start > end) {'+
'          isCounterClockWise = true;'+
'          float temp = start;'+
'          start = end;'+
'          end = temp;'+
'        }'+
'        bool notInRadianRange = true;'+
'        for (float diff = -1.0; diff < 2.0; diff += 1.0) {'+
'          float drad = rad + PI * diff * 2.0;'+
'          if (drad > start && drad < end) {'+
'            if (isCounterClockWise) {'+
'              vec2 coord = vec2(1.0-(drad-start)/(end-start), (dist-startRadius)/(endRadius-startRadius));'+
'              color = texture2D(gauge,coord);'+
'            } else {'+
'              vec2 coord = vec2((drad-start)/(end-start), (dist-startRadius)/(endRadius-startRadius));'+
'              color = texture2D(gauge,coord);'+
'            }'+
'            notInRadianRange = false;'+
'          }'+
'        }'+
'      } else if (dist > endRadius) { color = vec4(0.0,0.0,0.0,0.0); };           '+
'      gl_FragColor = color;'+
'    }';

Kien.RingGauge.RingFilter.prototype.initialize = function(sr, er, sa, ea) {
	PIXI.Filter.call(this, null, Kien.RingGauge.RingFilter._FragmentShader,
      {
        mappedMatrix : { type: 'mat3', value: new PIXI.Matrix() },
        gauge : { type: 'sampler2D', value: 0},
        gaugeWidth: {type: '1f', value:0.0},
        gaugeHeight: {type: '1f', value: 0.0},
        cx : {type: '1f', value: 0.5},
        cy : {type: '1f', value: 0.5},
        startRadius : { type: '1f', value : 0.1},
        endRadius : {type : '1f', value : 0.12},
        startRadian : {type : '1f', value : Math.PI * 0},
        endRadian : {type : '1f', value : Math.PI * 2},
      });
	this.startRadius = sr || 0.1;
	this.endRadius = er || 0.12;
	this.startRadian = sa || 0.0;
	this.endRadian = ea || Math.PI * 2;
}

Kien.RingGauge.RingFilter.prototype.apply = function(filterManager, input, output, clear){
	if (this.uniforms.gauge) {
		filterManager.calculateNormalizedScreenSpaceMatrix(this.uniforms.mappedMatrix);
		this.uniforms.gaugeWidth = this.uniforms.gauge ? this.uniforms.gauge.width : 0;
		this.uniforms.gaugeHeight = this.uniforms.gauge ? this.uniforms.gauge.height : 0;
		filterManager.applyFilter(this, input, output, clear);
	}
}

Object.defineProperties(Kien.RingGauge.RingFilter.prototype, {
	startRadius: {
		get: function() {
			return this.uniforms.startRadius;
		},
		set: function(value) {
			this.uniforms.startRadius = value;
		} 
	},
	endRadius: {
		get: function() {
			return this.uniforms.endRadius;
		},
		set: function(value) {
			this.uniforms.endRadius = value;
		} 
	},
	startRadian: {
		get: function() {
			return this.uniforms.startRadian;
		},
		set: function(value) {
			this.uniforms.startRadian = value;
		} 
	},
	endRadian: {
		get: function() {
			return this.uniforms.endRadian;
		},
		set: function(value) {
			this.uniforms.endRadian = value;
		} 
	},
	gauge: {
		get: function() {
			return this.uniforms.gauge;
		},
		set: function(value) {
			this.uniforms.gauge = value;
		}
	}
});
