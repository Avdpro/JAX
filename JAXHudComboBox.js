import {JAXHudObj} from "./JAXHudObj.js";
import {jaxHudState} from "./JAXHudState.js";

var JAXHudComboBox,__Proto;

__Proto=new JAXHudObj();

JAXHudComboBox=function(jaxEnv)
{
	var self;
	var colorBox,colorBorder;
	var border,borderStyle,coner;
	var text,fntName,fntSize,fntColor;
	var placeHolder="";
	var selectOnFocus=1;
	var _attrChanged;
	var signUpdate;

	JAXHudObj.call(this,jaxEnv);

	this.jaxClassFunc=JAXHudComboBox;

	self=this;

	signUpdate=this.signUpdate;

	colorBox=[255,255,255,255];
	colorBorder=[0,0,0,1];
	border=1;
	borderStyle=0;//0:Solid, 1:dashed, 2:dotted, 3:outset...
	coner=0;
	_attrChanged=0;

	Object.defineProperty(this,'attrChanged',{
		get:function(){return _attrChanged;},
		set:function(v){_attrChanged=1;},
		enumerable:false
	});

	//***********************************************************************
	//CSS属性:
	//***********************************************************************
	{
		//填充颜色:
		Object.defineProperty(this, 'bgColor', {
			get: function () {
				return colorBox;
			},
			set: function (v) {
				if (Array.isArray(v)) {
					colorBox[0] = v[0];
					colorBox[1] = v[1];
					colorBox[2] = v[2];
					colorBox[3] = v[3];
				} else if (typeof (v) === 'string') {
					//TODO: Code this:
				} else if (typeof (v) === 'number') {
					//TODO: Code this:
				}
				_attrChanged = 1;
				signUpdate();
			},
			enumerable: true
		});

		//边框尺寸:
		Object.defineProperty(this, 'border', {
			get: function () {
				return border;
			},
			set: function (v) {
				if (v!==border) {
					border=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//边框样式:
		Object.defineProperty(this, 'borderStyle', {
			get: function () {
				return borderStyle;
			},
			set: function (v) {
				if (v!==borderStyle) {
					borderStyle=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//边框颜色:
		Object.defineProperty(this, 'borderColor', {
			get: function () {
				return colorBorder;
			},
			set: function (v) {
				if (Array.isArray(v)) {
					colorBorder[0] = v[0];
					colorBorder[1] = v[1];
					colorBorder[2] = v[2];
					colorBorder[3] = v[3];
				} else if (typeof (v) === 'string') {
					//TODO: Code this:
				} else if (typeof (v) === 'number') {
					//TODO: Code this:
				}
				_attrChanged = 1;
				signUpdate();
			},
			enumerable: true
		});

		//圆角尺寸:
		Object.defineProperty(this, 'coner', {
			get: function () {
				return coner;
			},
			set: function (v) {
				if (v!==coner) {
					coner=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//文本:
		Object.defineProperty(this, 'text', {
			get: function () {
				if(self.webObj){
					text=self.webObj.value;
				}
				return text;
			},
			set: function (v) {
				if(v!==text){
					text=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//文本:
		Object.defineProperty(this, 'placeHolder', {
			get: function () {
				return placeHolder;
			},
			set: function (v) {
				if(v!==placeHolder){
					placeHolder=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//字体名字:
		Object.defineProperty(this, 'font', {
			get: function () {
				return fntName;
			},
			set: function (v) {
				if (v!==fntName) {
					fntName=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		//字体颜色:
		Object.defineProperty(this, 'color', {
			get: function () {
				return color;
			},
			set: function (v) {
				if (Array.isArray(v)) {
					fntColor[0] = v[0];
					fntColor[1] = v[1];
					fntColor[2] = v[2];
				} else if (typeof (v) === 'string') {
					//TODO: Code this:
				} else if (typeof (v) === 'number') {
					//TODO: Code this:
				}
				_attrChanged = 1;
				signUpdate();
			},
			enumerable: true
		});

		//字体尺寸:
		Object.defineProperty(this, 'fontSize', {
			get: function () {
				return fntSize;
			},
			set: function (v) {
				if (v!==fntSize) {
					fntSize=v;
					_attrChanged = 1;
					signUpdate();
				}
			},
			enumerable: true
		});

		Object.defineProperty(this, 'selectOnFocus', {
			get: function () {
				return selectOnFocus;
			},
			set: function (v) {
				if (v!==selectOnFocus) {
					selectOnFocus=v;
				}
			},
			enumerable: true
		});
	}

	//***********************************************************************
	//不会被继承的方法:
	//***********************************************************************
	{
		this._syncWebObjAttr=function(){
			let webObj,style;
			webObj=this.webObj;
			if(webObj){
				style=webObj.style;
				style.backgroundColor="rgba("+colorBox+")";
				style.borderRadius=""+coner+"px";
				if(border!==0) {
					switch (borderStyle) {
						case 0:
						default:
							style.borderStyle = "solid";
							break;
						case 1:
							style.borderStyle = "dashed";
							break;
						case 2:
							style.borderStyle = "dotted";
							break;
					}
					style.borderWidth = "" + border + "px";
				}else{
					style.borderStyle = "none";
					style.borderWidth = "0px";
				}
				style.borderColor="RGBA("+colorBorder+")";

				//Input 相关:
				webObj.value=text;
				style.fontSize=fntSize+"px";
				if(fntName){
					style.fontFamily=fntName;
				}else{
					style.fontFamily="";
				}
				style.color="rgb("+fntColor+")";
				webObj.placeholder=placeHolder;
			}
			_attrChanged=0;
		}
	}
};

JAXHudComboBox.prototype=__Proto;

//***************************************************************************
//属性列表/注册创建函数:
//***************************************************************************
{
	//CSS属性列表
	JAXHudComboBox.jaxPptSet=new Set(Array.from(JAXHudObj.jaxPptSet).concat([
		'bgColor','border','borderStyle','borderColor','coner',
		'text','font','color','fontSize','placeHolder'
	]));

	//---------------------------------------------------------------------------
	//注册基础Hud类
	JAXHudObj.regHudByType('edit', function (env) {
		return new JAXHudComboBox(env);
	});
}

//***************************************************************************
//可继承的成员函数:
//***************************************************************************
{
	//---------------------------------------------------------------
	//ApplyCSS的开始，创建WebObj:
	__Proto.preApplyCSS = function (cssObj)
	{
		var div, jaxEnv,jaxDiv,father;
		var self=this;
		jaxEnv=self.jaxEnv;
		jaxDiv=jaxEnv.jaxDiv;
		this.removeAllChildren();
		if(!this.webObj) {
			div = this.webObj = document.createElement('input');


			div.style.position = "absolute";
			div.style.boxSizing="border-box";
			father = this.father;
			if (father && father.webObj) {
				father.webObj.appendChild(div);
			}
			div.onfocus=function(){
				if(self.selectOnFocus){
					self.selectAll();
				}
				if(self.OnFocus){
					self.OnFocus();
				}
				console.log("Focus");
			};
			div.onblur=function(){
				if(self.OnBlur){
					self.OnBlur();
				}
				console.log("Blur");
			};
			div.oninput=function(){
				if(self.OnInput){
					self.OnInput();
				}
			};
			div.onkeyup=function(evt){
				if(evt.code==="Enter"){
					if(self.OnUpdate){
						self.OnUpdate();
					}
				}
			};
			div.jaxObj = this;
		}
		if(cssObj.faces){
			cssObj.jaxObjHash=1;
		}
		//确定StateObj:
		var stateObj=cssObj.hudState;
		if(stateObj){
			if(!stateObj.isJAXHudState) {
				stateObj = jaxHudState(this.jaxEnv, stateObj);
			}
			this.jaxEnv.pushHudState(stateObj);
			this.stateObj=stateObj;
			this.stateObj_=stateObj;
			stateObj.setupState();
		}else{
			this.stateObj=this.jaxEnv.getCurHudState();
		}
	};

	//---------------------------------------------------------------
	//ApplyCSS的最后，设置WebObj属性:
	__Proto.postApplyCSS = function (cssObj)
	{
		let list;
		list=this.items2Add_;
		if(Array.isArray(list)){
			this._applyItems(list);
		}
		{
			let hudPose, aniPose;
			hudPose = this.hudPose;
			aniPose = this.aniPose;
			aniPose.x = 0;
			aniPose.y = 0;
			aniPose.alpha = hudPose.alpha;
			aniPose.scale = hudPose.scale;
			aniPose.rot = hudPose.rot;
		}
		if(cssObj.face){
			this.showFace(cssObj.face);
		}
		this._syncWebObj();
		this._syncWebObjAttr();

		let stateObj=this.stateObj_;
		if(stateObj){
			this.jaxEnv.popHudState(stateObj);
		}
	};

	//---------------------------------------------------------------
	//更新控件内容
	__Proto.update=function()
	{
		let webObj;
		let x,y,aniPose,hudPose;

		hudPose=this.hudPose;
		aniPose=this.aniPose;
		aniPose.x=0;
		aniPose.y=0;
		aniPose.alpha=hudPose.alpha;
		aniPose.scale=hudPose.scale;
		aniPose.rot=hudPose.rot;

		webObj=this.webObj;
		if(webObj) {
			if(this.attrChanged){
				this._syncWebObjAttr();
			}
			if(this.poseChanged) {
				this._syncWebObj();
			}
		}
	};

	//---------------------------------------------------------------
	//开始编辑
	__Proto.startEdit=function(){
		this.webObj.focus();
		if(this.selectOnFocus){
			this.selectAll();
		}
	};

	//---------------------------------------------------------------
	//结束编辑
	__Proto.endEdit=function(){
		this.webObj.blur();
	};

	//---------------------------------------------------------------
	//选中全部文本
	__Proto.selectAll=function(){
		if(this.attrChanged){
			this._syncWebObjAttr();
		}
		this.webObj.setSelectionRange(0,this.webObj.value.length);
	};
}

export {JAXHudComboBox};