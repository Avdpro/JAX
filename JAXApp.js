import { JAXEnv } from './JAXEnv.js';
import {JAXHudLayer} from './JAXHudLayer.js'
import {jaxHudState} from "./JAXHudState.js";

var JAXApp,__Proto;

JAXApp=function(jaxEnv,appDiv){
	if(!jaxEnv)
		return;

	this.jaxClassFunc=JAXApp;

	this.jaxEnv=jaxEnv;
	this.appDiv=appDiv;
	this.clientW=this.w=appDiv.offsetWidth;
	this.clientH=this.h=appDiv.offsetHeight;
	this.layers_=[];

	this.uiEvent=1;

	Object.defineProperty(this,'layers',{
		set:function(list){
			let layerCSS,layer;
			for(layerCSS of list){
				layer=new JAXHudLayer(this,appDiv);
				layer.owner_=this;
				layer.applyCSS(layerCSS);
				this.layers_.push(layer);
			}
		}
	});

	//可能会用到的回调函数:
	//this.OnCreate=null;
	//this.OnFree=null;
	//this.AfCreate=null;
};

JAXApp.jaxPptSet=new Set(["layers"]);

__Proto=JAXApp.prototype={};

//---------------------------------------------------------------------------
//根据CSS创建App
__Proto.startByDef=function(cssObj)
{
	this.jaxEnv.pushObjHasher(this);
	JAXEnv.applyCSS(this,cssObj,JAXApp.jgxPptSet);
	if(this.OnCreate){
		this.OnCreate();
	}
	if(this.AfCreate){
		this.jaxEnv.callAfter(this.AfCreate.bind(this));
	}
	this.jaxEnv.popObjHasher(this);
};

//---------------------------------------------------------------------------
//根据CSS创建App
__Proto.update=function()
{
	let list,layer;
	list=this.layers_;
	for(layer of list){
		layer.update();
	}
	//TODO: Code this:
};

//---------------------------------------------------------------------------
//网页窗口尺寸发生变化:
__Proto.OnResize=function(w,h){
	var style=this.appDiv.style;
	var list,i,n;
	this.w=w;
	this.h=h;
	style.width=""+w+"px";
	style.height=""+h+"px";
	list=this.layers_;
	n=list.length;
	for(i=0;i<n;i++){
		list[i]._doLayout();
	}
};

//---------------------------------------------------------------
//ApplyCSS合并属性之前
__Proto.preApplyCSS = function (cssObj){
	var stateObj=cssObj.appState;
	if(stateObj){
		if(!stateObj.isJAXHudState) {
			stateObj = jaxHudState(this.jaxEnv, stateObj);
		}
		this.jaxEnv.pushHudState(stateObj);
		this.stateObj=stateObj;
		this.stateObj_=stateObj;
		stateObj.setupState();
	}
};

//---------------------------------------------------------------
//ApplyCSS的最后:
__Proto.postApplyCSS = function (cssObj) {
	let stateObj=this.stateObj_;
	if(stateObj){
		this.jaxEnv.popHudState(stateObj);
	}

};

export {JAXApp};


