import {JAXApp} from "./JAXApp.js";
import {JAXDisk} from "./JAXDisk.js"
import {JAXDataObj} from "./JAXDataObj.js";

var JAXEnv,__Proto,$JXV,JAXStateProxy,$V;

var curHasher,hasherList=[];
var curHudView,hudViewList=[];
var curHudState,hudStateList=[];
var newHudStates=[];

var willUpdate=0;
var callAFList=[];
var updateList=[];
var updateRequestRef=0;
var nextIncHash=0;
var curTimeHashTime=0;
var curTimeHashCnt=0;

var htmlBody=null;

// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
var userAgent = navigator.userAgent;
var platform = navigator.platform;

var gecko = /gecko\/\d/i.test(userAgent);
var ie_upto10 = /MSIE \d/.test(userAgent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
var edge = /Edge\/(\d+)/.exec(userAgent);
var ie = ie_upto10 || ie_11up || edge;
var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
var webkit = !edge && /WebKit\//.test(userAgent);
var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
var chrome = !edge && /Chrome\//.test(userAgent);
var presto = /Opera\//.test(userAgent);
var safari = /Apple Computer/.test(navigator.vendor);
var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
var phantom = /PhantomJS/.test(userAgent);

var ios = safari && (/Mobile\/\w+/.test(userAgent) || navigator.maxTouchPoints > 2);
var android = /Android/.test(userAgent);
// This is woefully incomplete. Suggestions for alternative methods welcome.
var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
var mac = ios || /Mac/.test(platform);
var chromeOS = /\bCrOS\b/.test(userAgent);
var windows = /win/i.test(platform);

var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
if (presto_version) { presto_version = Number(presto_version[1]); }
if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
var captureRightClick = gecko || (ie && ie_version >= 9);

JAXEnv=function(jaxDiv)
{
	var self;

	self=this;
	htmlBody=document.body;
	this.jaxDiv=jaxDiv;
	this.app=null;
	this.onMouseUps=[];
	this.onMouseMoves=[];
	this.curDrag=null;
	this.thisUpdateProc=this.update.bind(this);
	document.addEventListener('mouseup',this.OnMouseUp.bind(this),false);//注册鼠标抬起消息，在冒泡阶段
	document.addEventListener('mousemove',this.OnMouseMove.bind(this),false);//注册鼠标移动消息，在冒泡阶段

	document.addEventListener("keydown",this.OnKeyDown.bind(this),true);
	document.addEventListener("keyup",this.OnKeyUp.bind(this),true);

	//响应窗口大小变化:
	window.onresize=function(){
		console.log("Window width: "+window.innerWidth);
		console.log("Window height: "+window.innerHeight);
		//通知App:
		self.app.OnResize(window.innerWidth,window.innerHeight);
	};

	//测量文本宽度用div，这个需要改进:
	this.textSizeDiv=document.createElement('div');
	this.textSizeDiv.style.position="absolute";
	this.textSizeDiv.style.top="-2000px";
	jaxDiv.appendChild(this.textSizeDiv);

	//打开选择文件对话框的辅助按钮
	this.webFileInput=document.getElementById("JAXFileInput");
	if(this.webFileInput) {
		this.webFileInput.onchange = function () {
			if (self.OnFileInputChange) {
				self.OnFileInputChange(this.files);
			}
			this.value="";
		};
	}

	//用来触发文件下载的辅助按钮
	this.webFileDownload=document.getElementById("JAXFileDownload");
	return;
	//测试JAXDisk的代码:
	JAXDisk.init().then(()=>{
		console.log("JAXDisk inited!");
		console.log("JAXDisks: "+JAXDisk.getDisks());
		JAXDisk.newDisk("TestDrive").then((disk)=>{
			console.log("Will save file!");
			disk.saveFile("hello.js","console.log('Hello file');");
			disk.newDir("lib").then(()=>{
				disk.saveFile("lib/hello2.js","console.log('Hello file');");
			});
			disk.newDir("assets/images");
			disk.getEntries("/").then(list=>{
				let stub;
				if(!list){
					console.log("Path is not exist");
					return;
				}
				for(stub of list){
					console.log(stub.name+" is "+(stub.dir?"dir":"file"));
				}
			})
		});
	});
};

__Proto=JAXEnv.prototype={};

//***************************************************************************
//文件路径工具函数:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//得到路径的文件名:
	JAXEnv.getFileName=function(path){
		var pos;
		pos=path.lastIndexOf("/");
		if(pos>=0){
			return path.substring(pos+1);
		}
		pos=path.lastIndexOf(":");
		if(pos>=0){
			return path.substring(pos+1);
		}
		return path;
	};

	//-----------------------------------------------------------------------
	//得到路径的不带类型的文件名:
	JAXEnv.getFileNameNoExt=function(path){
		var pos,fileName;
		pos=path.lastIndexOf("/");
		if(pos>=0){
			fileName=path.substring(pos+1);
		}else {
			pos = path.lastIndexOf(":");
			if (pos >= 0) {
				fileName=path.substring(pos + 1);
			}else {
				fileName = path;
			}
		}
		pos=fileName.lastIndexOf(".");
		if(pos>=0) {
			return fileName.substring(0,pos);
		}
		return fileName;
	};

	//-----------------------------------------------------------------------
	//得到路径的文件夹:
	JAXEnv.getPathDir=function(path){
		var pos;
		pos=path.lastIndexOf("/");
		if(pos>=0){
			return path.substring(0,pos);
		}
		pos=path.lastIndexOf(":");
		if(pos>=0){
			return path.substring(0,pos+1);
		}
		return "";
	};

	//-----------------------------------------------------------------------
	//得到路径的小写扩展名:
	JAXEnv.getFileExt=function(path){
		var pos;
		pos=path.lastIndexOf(".");
		if(pos>=0){
			return path.substring(pos+1).toLowerCase();
		}
		return "";
	};

	//-----------------------------------------------------------------------
	//计算相对路径:
	JAXEnv.divFilePath=function(filePath,basePath){
		var fileDirs,baseDirs,i,n;
		fileDirs=filePath.split("/");
		baseDirs=basePath.split("/");
		n=Math.min(fileDirs.length,baseDirs.length);
		for(i=0;i<n;i++){
			if(fileDirs[0]===baseDirs[0]){
				fileDirs.shift();
				baseDirs.shift();
				i--;n--;
			}else{
				break;
			}
		}
		n=baseDirs.length;
		for(i=0;i<n;i++){
			fileDirs.unshift("..");
		}
		return fileDirs.join("/");
	};

	//-----------------------------------------------------------------------
	//合并相对路径:
	JAXEnv.genFilePath=function(basePath,filePath){
		var fileDirs,baseDirs,i,n;
		fileDirs=filePath.split("/");
		baseDirs=basePath.split("/");
		n=fileDirs.length;
		for(i=0;i<n;i++){
			if(fileDirs[i]===".."){
				baseDirs.pop();
			}else{
				break;
			}
		}
		fileDirs=baseDirs.concat(fileDirs);
		return fileDirs.join("/");
	};
}

//***************************************************************************
//CSS工具函数:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//链接CSS对象
	JAXEnv.linkCSSObj=function(obj){
		var cssObj,cssName;
		cssObj=obj.css;
		if(cssObj && typeof(cssObj)==='object'){
			this.linkCSSObj(cssObj);
			obj.__proto__=cssObj;
			obj.$JAXCssName="css";
			delete obj.css;
			return 1;
		}
		cssObj=obj.type;
		if(cssObj && typeof(cssObj)==='object'){
			this.linkCSSObj(cssObj);
			obj.__proto__=cssObj;
			obj.$JAXCssName="type";
			delete obj.css;
			return 1;
		}
		return 0;
	};

	//-----------------------------------------------------------------------
	//反链接CSS对象
	JAXEnv.unlinkCSSObj=function(obj)
	{
		var cssObj;
		cssObj=obj.__proto__;
		//cssObj=Object.getPrototypeOf(obj);
		if(cssObj&&obj.$JAXCssName){
			this.unlinkCSSObj(cssObj);
			obj[obj.$JAXCssName]=cssObj;
			obj.__proto__=null;
			delete obj.$JAXCssName;
			//Object.setPrototypeOf(obj,null);
		}
	};

	//-----------------------------------------------------------------------
	//CSS
	JAXEnv.applyCSS=function(obj,cssObj,pptSet)
	{
		var jaxEnv,app,appCfg,txtLib,cssLib,appData,state;
		let key,curCSSObj,val,view,newTrackStubs;
		let prtObj,hasCSS;

		jaxEnv=obj.jaxEnv;
		app=jaxEnv.app;
		appCfg=app.appCfg;
		txtLib=app.txtLib;
		cssLib=jaxEnv.cssLib;
		appData=app.appData;
		state=curHudState;
		view=curHudView;
		newTrackStubs=[];

		//-------------------------------------------------------------------------
		//根据字符串生成Trace的函数，另外纪录要追踪的变量:
		var _makeTraceValFunc = function (val, obj, key, atraces) {
			let code, pos,traced, func;
			code = val.substring(2, val.length - 1);

			pos=code.indexOf("}@{");
			if(pos>0){
				traced=code.substring(pos+3);
				traced=traced.split(",");
				atraces.push.apply(atraces,traced);
				code=code.substring(0,pos);
			}
			//生成表达式函数:
			func = new Function("obj", "key", "app", "appCfg", "txtLib" ,"appData", "cssLib", "state","obj[key]=(" + code + ");").bind(null, obj, key, app, appCfg, txtLib, appData,cssLib,state);
			return func;
		};

		hasCSS=this.linkCSSObj(cssObj);

		if(!pptSet){
			pptSet=obj.constructor.jaxPptSet;
		}
		if(!pptSet){
			pptSet=obj.jaxClassFunc.jaxPptSet;
		}
		if(typeof(obj.preApplyCSS)==='function'){
			obj.preApplyCSS(cssObj);
		}
		if(pptSet){
			let traces;
			for(key of pptSet){
				//console.log("Check ppt: "+key+"");
				//console.log("    ="+cssObj[key]);
				if(key in cssObj) {
					val=cssObj[key];
					if(val instanceof $JXV){
						obj[key] = val;
					}else if(typeof(val)==="string" && val.startsWith("${")&&val.endsWith("}")){
						throw "Old ${...} found!";
					}else {
						obj[key] = val;
					}
				}
			}
			curCSSObj=cssObj;
			for(let k in curCSSObj){//只有这样才能得到整个prototype链里全部的变量名:
				key=k;
				// if(cssObj.id==="btnName" && key==="name") {
				// 	console.log("Check ex ppt: " + key + "?" + pptSet.has(key) + "?" + (key in obj));
				// }
				if(!pptSet.has(key) && !(key in obj)){
					let desc;
					if(key.startsWith("%")) {
						//这是个参数定义，不是真正的Val:
						prtObj=cssObj;
						desc=null;
						while(prtObj && (!desc)){
							desc=Object.getOwnPropertyDescriptor(prtObj,key);
							prtObj=prtObj.__proto__;
						}
						if(desc&& (!("value" in desc))){
							let hasKey;
							key=key.substring(1);
							val=obj[key];
							hasKey=key in obj;
							Object.defineProperty(obj,key,desc);
							if(hasKey){
								obj[key]=val;
							}
						}
					}else {
						val = curCSSObj[key];
						if (val !== undefined) {
							if(val instanceof $JXV){
								obj[key] = val;
							}else if (typeof (val) === "string" && val.startsWith("${") && val.endsWith("}")) {
								throw "Old ${} found!";
							} else {
								obj[key] = val;
							}
						}
					}
				}
			}
		}else{
			let traces;
			curCSSObj=cssObj;
			do{
				for(key in curCSSObj){//只有这样才能得到整个prototype链里全部的变量名:
					if(!(key in obj)){
						val=curCSSObj[key];
						if(val!==undefined) {
							if(val instanceof $JXV) {
								obj[key] = val;
							}else if(typeof(val)==="string" && val.startsWith("${")&&val.endsWith("}")){
								throw "Old ${} found!";
							}else {
								obj[key] = val;
							}
						}
					}
				}
				curCSSObj=Object.getPrototypeOf(curCSSObj);
			}while(curCSSObj);
		}
		if(typeof(obj.finApplyCSS)==='function'){
			obj.finApplyCSS(cssObj);
		}
		if(hasCSS) {
			this.unlinkCSSObj(cssObj);
		}
		if(typeof(obj.postApplyCSS)==='function'){
			obj.postApplyCSS(cssObj);
		}
	};
}

//***************************************************************************
//有关启动App的函数:
//***************************************************************************
{
	//---------------------------------------------------------------------------
	//创建App
	__Proto.createApp=function()
	{
		if(this.app){
			throw "Error: JAXEnv already has a App!";
		}
		this.app=new JAXApp(this,this.jaxDiv);
		return this.app;
	};

	//---------------------------------------------------------------------------
	//初始化App
	__Proto.initApp=function(appDef)
	{
		if(!this.app){
			throw "Error: JAXEnv has no App!";
		}
		this.app.startByDef(appDef);
		return this.app;
	};

	//---------------------------------------------------------------------------
	//创建且初始化App
	__Proto.startApp=function(appDef)
	{
		this.app=new JAXApp(this,this.jaxDiv);
		this.app.startByDef(appDef);
		return this.app;
	};
}

//***************************************************************************
//有关Update的函数:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	__Proto.signUpdate=function(hud)
	{
		if(hud){
			updateList.push(hud);
		}else{
			throw "No hud to sign update"
		}

		if(willUpdate){
			return;
		}
		willUpdate=1;
		if(updateRequestRef){
			window.clearTimeout(updateRequestRef);
			updateRequestRef=0;
		}
		window.requestAnimationFrame(this.thisUpdateProc);
	};

	//-----------------------------------------------------------------------
	__Proto.update=function()
	{
		let func,list,hud;

		if(updateRequestRef){
			window.clearTimeout(updateRequestRef);
			updateRequestRef=0;
		}

		willUpdate=0;
		this.app.update();

		list=updateList.splice(0);
		for(hud of list){
			hud._update();
		}

		//回调函数:
		list=callAFList;
		callAFList=[];
		for(func of list){
			func();
		}

		if(!willUpdate){
			updateRequestRef=window.setTimeout(this.thisUpdateProc,50);
		}
	};
}

//***************************************************************************
//有关AF回调函数的函数:
//***************************************************************************
{
	__Proto.callAfter=function(func)
	{
		callAFList.push(func);
	};
}


//***************************************************************************
//有关ObjHasher/View/HudState的函数
//***************************************************************************
{
	let forceNewJaxId=0;

	//---------------------------------------------------------------------------
	//是否强制使用新的JaxId
	JAXEnv.isForceNewJaxId=function(){
		return forceNewJaxId?1:0;
	};

	//---------------------------------------------------------------------------
	//设置是否强制使用新的JaxId
	JAXEnv.setForceNewJaxId=function(v){
		if(v){
			forceNewJaxId++;
		}else{
			forceNewJaxId--;
		}
		forceNewJaxId=forceNewJaxId<=0?0:forceNewJaxId;
		return forceNewJaxId;
	};

	//---------------------------------------------------------------------------
	//验证一个jaxId
	JAXEnv.checkJaxId=function(jaxId){
		return forceNewJaxId?this.genTimeHash():jaxId;
	};

	//---------------------------------------------------------------------------
	//生成一个序号类的HashID:
	__Proto.genIncHash = function () {
		return "INC"+(nextIncHash++);
	};

	//---------------------------------------------------------------------------
	//生成一个时间类的HashID:
	JAXEnv.genTimeHash=__Proto.genTimeHash = function () {
		var time,hash;
		time=Date.now();
		hash=Number(time).toString(32);
		if(time===curTimeHashTime){
			curTimeHashCnt++;
		}else{
			curTimeHashCnt=0;
		}
		hash+=""+curTimeHashCnt;
		curTimeHashTime=time;
		return hash.toUpperCase();
	};

	//---------------------------------------------------------------------------
	//纪录(压入)当前的ObjHasher
	__Proto.pushObjHasher = function (obj) {
		if (curHasher) {
			hasherList.push(curHasher);
		}
		curHasher = obj;
	};

	//---------------------------------------------------------------------------
	//弹出当前的ObjHasher，
	__Proto.popObjHasher = function (obj) {
		if(!obj || obj===curHasher){
			curHasher = hasherList.pop();
		}
	};

	//---------------------------------------------------------------------------
	//给当前的ObjHasher增加一个纪录的对象
	__Proto.addHashObj = function (id,obj) {
		if (curHasher) {
			curHasher[id]=obj;
		}
	};

	//---------------------------------------------------------------------------
	//纪录(压入)当前的View
	__Proto.pushHudView = function (obj) {
		if (curHudView) {
			hudViewList.push(curHudView);
		}
		curHudView = obj;
	};

	//---------------------------------------------------------------------------
	//弹出当前的HudView，
	__Proto.popHudView = function (obj) {
		curHudView = hudViewList.pop();
	};

	//---------------------------------------------------------------------------
	//得到当前的HudView，
	__Proto.getHudView = function () {
		return curHudView;
	};


	//---------------------------------------------------------------------------
	//纪录(压入)当前的HudState
	__Proto.pushHudState = function (obj) {
		if (curHudState) {
			hudStateList.push(curHudState);
		}
		curHudState = obj;
	};

	//---------------------------------------------------------------------------
	//弹出当前的HudState，
	__Proto.popHudState = function (obj) {
		curHudState = hudStateList.pop();
	};

	//---------------------------------------------------------------------------
	//得到当前的HudState，
	__Proto.getCurHudState = function () {
		return curHudState;
	};

	//---------------------------------------------------------------------------
	//纪录新建的HudState
	__Proto.newHudState = function (obj) {
		newHudStates.push(obj);
	};

	//---------------------------------------------------------------------------
	//弹出当前的HudState，
	__Proto.finNewHudStates = function (finalObj,updateList,traceList) {
		var i,obj;
		finalObj.setupState_(null,null,updateList,traceList);
		for(i=0;i<newHudStates.length;i++){
			obj=newHudStates[i];
			if(!obj.ownerObj_){
				obj.setupState_(null,null,updateList,traceList);
			}
		}
		newHudStates.splice(0);
	};
}

//***************************************************************************
//鼠标/拖拽等事件函数
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//注册一个需要知道鼠标抬起消息回调函数
	__Proto.addOnMouseUp = function (func) {
		if (func._inJAXMouseUp) {
			return;
		}
		func._inJAXMouseUp = 1;
		this.onMouseUps.push(func);
	};

	//-----------------------------------------------------------------------
	//注销一个需要知道鼠标抬起消息回调函数
	__Proto.removeOnMouseUp = function (func) {
		var list, i, n;
		func._inJAXMouseUp = 0;
	};

	//-----------------------------------------------------------------------
	//系统处理鼠标抬起消息:
	__Proto.OnMouseUp = function (e) {
		var list, i, n, func,drag;
		list = this.onMouseUps;
		n = list.length;
		for (i = 0; i < n; i++) {
			func=list[i];
			if(func._inJAXMouseUp){
				func(e,1);
			}else{
				list.splice(i,1);
				i--;n--;
			}
		}
		//drag:
		drag=this.curDrag;
		if(drag){
			let dx,dy;
			dx=e.x-drag.ox;
			dy=e.y-drag.oy;
			drag.OnDone(e,0,dx,dy);
			this.curDrag=null;
		}
	};

	//-----------------------------------------------------------------------
	//注册一个需要知道鼠标移动消息回调函数
	__Proto.addOnMouseMove = function (func) {
		if (func._inJAXMouseMove) {
			return;
		}
		func._inJAXMouseMove = 1;
		this.onMouseMoves.push(func);
	};

	//-----------------------------------------------------------------------
	//注销一个需要知道鼠标移动消息回调函数
	__Proto.removeOnMouseMove = function (func) {
		var list, i, n;
		func._inJAXMouseMove = 0;
	};

	//-----------------------------------------------------------------------
	//系统处理鼠标移动消息:
	__Proto.OnMouseMove = function (e) {
		var list, i, n, func,drag;
		list = this.onMouseMoves;
		n = list.length;
		for (i = 0; i < n; i++) {
			func=list[i];
			if(func._inJAXMouseMove){
				func(e,1);
			}else{
				list.splice(i,1);
				i--;n--;
			}
		}
		//drag:
		drag=this.curDrag;
		if(drag){
			let dx,dy;
			dx=e.x-drag.ox;
			dy=e.y-drag.oy;
			drag.OnDrag(e,dx,dy);
		}
	};

	//-----------------------------------------------------------------------
	//开始拖拽
	__Proto.startDrag=function(e,stub){
		if(this.curDrag){
			let dx,dy;
			dx=e.x-this.curDrag.ox;
			dy=e.y-this.curDrag.oy;
			this.curDrag.OnDone(e,1,dx,dy);
		}
		this.curDrag=stub;
		this.curDrag.ox=e.x;
		this.curDrag.oy=e.y;
	};

}

//***************************************************************************
//键盘消息/快捷键处理:
//***************************************************************************
{
	let OnKeyDowns=[];
	let OnKeyUps=[];

	//-----------------------------------------------------------------------
	//注册一个按键按下消息回调函数
	__Proto.addOnKeyDown = function (func) {
		if (func._inJAXKeyDown) {
			return;
		}
		func._inJAXKeyDown = 1;
		OnKeyDowns.push(func);
	};

	//-----------------------------------------------------------------------
	//注销一个按键按下消息回调函数
	__Proto.removeOnKeyDown = function (func) {
		var list, i, n;
		func._inJAXKeyDown = 0;
	};

	//-----------------------------------------------------------------------
	//注册一个按键按下消息回调函数
	__Proto.addOnKeyUp = function (func) {
		if (func._inJAXKeyUp) {
			return;
		}
		func._inJAXKeyUp = 1;
		OnKeyUps.push(func);
	};

	//-----------------------------------------------------------------------
	//注销一个按键按下消息回调函数
	__Proto.removeOnKeyUp = function (func) {
		var list, i, n;
		func._inJAXKeyUp = 0;
	};

	//-----------------------------------------------------------------------
	//键盘按下消息
	__Proto.OnKeyDown=function(e){
		let list,i,n,func;
		if(e.target===htmlBody) {
			list=OnKeyDowns;
			n=list.length;
			for(i=0;i<n;i++){
				func=list[i];
				if(func._inJAXKeyDown){
					if(func(e)){
						e.preventDefault();
						e.stopPropagation();
					}
				}else{
					list.splice(i,1);
					i--;n--;
				}
			}
		}
	};

	//-----------------------------------------------------------------------
	//键盘抬起消息
	__Proto.OnKeyUp=function(e){
		let list,i,n,func;
		if(e.target===htmlBody) {
			list=OnKeyUps;
			n=list.length;
			for(i=0;i<n;i++){
				func=list[i];
				if(func._inJAXKeyUp){
					if(func(e)){
						e.preventDefault();
						e.stopPropagation();
					}
				}else{
					list.splice(i,1);
					i--;n--;
				}
			}
		}
	};
}

//***************************************************************************
//系统对话框机制，可以替换:
//***************************************************************************
{

}

//***************************************************************************
//属性的DYNA赋值
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//用来鉴别一个对象是不是JAXHudState的辅助类:
	JAXStateProxy=function(orgObj){
		this.orgObj=orgObj;
	};

	//-----------------------------------------------------------------------
	//JAX系统追踪动态变量:
	$V=$JXV=function(funcGet,traces,isNew=1){
		var val,func,defaultTgt,traced,traceView;
		if(isNew){
			return new $JXV(funcGet,traces,0);
		}
		defaultTgt=null;
		traced=0;
		traceView=null;
		if(traces) {
			val = funcGet();
		}
		this.func=function(obj,key){
			if(func){
				return func;
			}
			func=function(){obj[key]=funcGet();};
			return func;
		};
		Object.defineProperty(this,"val",{
			get:function(){
				//如果不是追踪模式的，每次调用funcGet:
				return traces?val:funcGet();
			}
		});
		if(traces){
			if(Array.isArray(traces)){
				let i,n,list,stub;
				list=traces;
				if(typeof(traces==="string")){
					//合格了:
					this.traces=traces;
				}else if(list.length===2 && typeof(list[1])==="string"){
					//合格了:
					this.traces=traces=[traces];
				}else {
					for (i = 0; i < n; i++) {
						stub = list[i];
						if(typeof(stub)==="string"){
							list[i] =[null,stub];
						}else if (stub instanceof JAXDataObj || stub instanceof JAXStateProxy) {
							list[i] = [stub, "*"];
						} else if (Array.isArray(stub)) {
							//合格了:
						} else if (stub.obj) {
							//对象转换为数组:
							list[i] = [stub.obj, stub.msg || stub.val || "*"];
						} else {
							//无效的追踪:
							list.splice(i, 1);
							i--;
							n--;
						}
					}
					if (list.length) {
						traces=this.traces = list;
					}
				}
			}else{
				if(traces instanceof JAXDataObj || traces instanceof JAXStateProxy){
					traces=this.traces=[[traces,"*"]];
				}else if(traces.obj){
					traces=this.traces=[[traces.obj,traces.msg||traces.val||"*"]];
				}else if(typeof(traces)==="string"){
					this.traces=traces;
				}else{
					traces=null;
				}
			}
		}

		//-------------------------------------------------------------------
		//设置追踪:
		this.trace=function(defaultTgt_,ownerObj,valName,view){
			defaultTgt=defaultTgt_;
			traceView=view;
			if(!traces){
				if(defaultTgt){
					if(defaultTgt instanceof JAXStateProxy){
						defaultTgt.addUpdateFunc(func?func:this.func(ownerObj,valName));
						traced=1;
					}/*else{
						defaultTgt.bindValNotify("*",func?func:this.func(ownerObj,valName),view);
					}*/
				}
			}
			if(typeof(traces)==="string"){
				defaultTgt.bindValNotify(traces,func?func:this.func(ownerObj,valName),view);
				traced=1;
			}else if(Array.isArray(traces)){
				let i,n,stub,tgt,msg;
				n=traces.length;
				for(i=0;i<n;i++){
					stub=traces[i];
					stub[0]=tgt=stub[0]||defaultTgt;
					stub[1]=msg=stub[1]||"*";
					if(tgt) {
						tgt.bindValNotify(msg, func ? func : this.func(ownerObj, valName), view);
					}
				}
				traced=1;
			}
		};

		//-------------------------------------------------------------------
		//取消追踪
		this.untrace=function(){
			if(!traced || !func){
				return;
			}
			if(!traces){
				if((defaultTgt instanceof JAXStateProxy) &&(!defaultTgt.deadOut)){
					defaultTgt.removeUpdateFunc(func);
				}
			}else{
				if(typeof(traces)==="string"){
					defaultTgt.removeUpdateFunc(traces,func,traceView);
				}else if(Array.isArray(traces)){
					let i,n,stub,tgt,msg;
					n=traces.length;
					for(i=0;i<n;i++){
						stub=traces[i];
						tgt=stub[0];
						msg=stub[1];
						if(tgt.removeValNotify){
							tgt.removeValNotify(msg,func,traceView);
						}
					}
				}
			}
			traced=0;
		}
	};
}


export {JAXEnv,$JXV,$V,JAXStateProxy};