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
	document.addEventListener('mouseup',this.OnMouseUp.bind(this),false);//??????????????????????????????????????????
	document.addEventListener('mousemove',this.OnMouseMove.bind(this),false);//??????????????????????????????????????????

	document.addEventListener("keydown",this.OnKeyDown.bind(this),true);
	document.addEventListener("keyup",this.OnKeyUp.bind(this),true);

	//????????????????????????:
	let sizeTimer=null;
	window.onresize=function(){
		let w,h;
		console.log("Window width: "+window.innerWidth);
		console.log("Window height: "+window.innerHeight);
		//??????App:
		w=window.innerWidth;
		h=window.innerHeight;
		jaxDiv.style.width=w+"px";
		jaxDiv.style.height=h+"px";
		if(sizeTimer){
			clearTimeout(sizeTimer);
		}
		sizeTimer=setTimeout(()=>{
			sizeTimer=null;
			if(self.app){
				self.app.OnResize(w,h);
			}
		},1000);
	};

	//?????????????????????div?????????????????????:
	this.textSizeDiv=document.createElement('div');
	this.textSizeDiv.style.position="absolute";
	this.textSizeDiv.style.top="-2000px";
	jaxDiv.appendChild(this.textSizeDiv);

	//??????????????????????????????????????????
	this.webFileInput=document.getElementById("JAXFileInput");
	if(this.webFileInput) {
		this.webFileInput.onchange = function () {
			if (self.OnFileInputChange) {
				self.OnFileInputChange(this.files);
			}
			this.value="";
		};
	}

	//???????????????????????????????????????
	this.webFileDownload=document.getElementById("JAXFileDownload");
};

__Proto=JAXEnv.prototype={};

//***************************************************************************
//????????????????????????:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//????????????????????????:
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
	//???????????????????????????????????????:
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
	//????????????????????????:
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
	//??????????????????????????????:
	JAXEnv.getFileExt=function(path){
		var pos;
		pos=path.lastIndexOf(".");
		if(pos>=0){
			return path.substring(pos+1).toLowerCase();
		}
		return "";
	};

	//-----------------------------------------------------------------------
	//??????????????????:
	JAXEnv.divFilePath=function(filePath,basePath){
		var fileDirs,baseDirs,i,n;
		if(!basePath){
			return filePath;
		}
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
	//??????????????????:
	JAXEnv.genFilePath=function(basePath,filePath){
		let pts,diskPrefix,fileDirs,baseDirs,i,n,diskPath;
		//?????????
		pts=basePath.split(":");
		if(pts.length===2){
			diskPrefix=pts[0]+":";
			basePath=pts[1];
		}else{
			diskPrefix="";
		}
		if(filePath.startsWith("/")){
			//??????????????????????????????????????????
			return diskPrefix+filePath;
		}
		let pos1=filePath.indexOf(":");
		let pos2=filePath.indexOf("/");
		if(pos1>0){
			if(pos2<0 || pos2>pos1){
				return filePath;//??????Path????????????????????????
			}
		}
		//??????"./"
		while(filePath.startsWith("./")){
			filePath=filePath.substring(2);
		}
		fileDirs=filePath.split("/");
		baseDirs=basePath.split("/");
		n=fileDirs.length;
		for(i=0;i<n;i++){
			if(fileDirs[i]===".."){
				fileDirs.shift();
				baseDirs.pop();
				i--;n--;
			}else{
				break;
			}
		}
		fileDirs=baseDirs.concat(fileDirs);
		fileDirs=fileDirs.filter((item,idx)=>(idx===0||(!!item && item!==".")));
		return diskPrefix+fileDirs.join("/");
	};

	//-----------------------------------------------------------------------
	//????????????????????????URL:
	JAXEnv.diskPath2URL=function(diskPath){
		let pos,diskName,filePath;
		if(diskPath.startsWith("/")){
			return "/jaxweb/disks"+diskPath;
		}
		pos=diskPath.indexOf(":");
		if(pos<0){
			throw "Can't find disk name from: "+diskPath;
		}
		diskName=diskPath.substring(0,pos);
		filePath=diskPath.substring(pos+1);
		if(filePath.startsWith("/")){
			filePath=filePath.substring(1);
		}
		return "/jaxweb/disks/"+diskName+"/"+filePath;
	};
}

//***************************************************************************
//CSS????????????:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//??????CSS??????
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
	//?????????CSS??????
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
		//?????????????????????Trace??????????????????????????????????????????:
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
			//?????????????????????:
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
			for(let k in curCSSObj){//??????????????????????????????prototype????????????????????????:
				key=k;
				// if(cssObj.id==="btnName" && key==="name") {
				// 	console.log("Check ex ppt: " + key + "?" + pptSet.has(key) + "?" + (key in obj));
				// }
				if(!pptSet.has(key) && !(key in obj)){
					let desc;
					if(key.startsWith("%")) {
						//???????????????????????????????????????Val:
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
				for(key in curCSSObj){//??????????????????????????????prototype????????????????????????:
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
//??????Update?????????:
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
	
		//JAXDataObj.update();

		if(!willUpdate){
			updateRequestRef=window.setTimeout(this.thisUpdateProc,50);
		}
	};
}

//***************************************************************************
//??????AF?????????????????????:
//***************************************************************************
{
	__Proto.callAfter=JAXDataObj.callAfter;
}

//***************************************************************************
//??????ObjHasher/View/HudState?????????
//***************************************************************************
{
	let forceNewJaxId=0;

	//---------------------------------------------------------------------------
	//????????????????????????JaxId
	JAXEnv.isForceNewJaxId=function(){
		return forceNewJaxId?1:0;
	};

	//---------------------------------------------------------------------------
	//??????????????????????????????JaxId
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
	//????????????jaxId
	JAXEnv.checkJaxId=function(jaxId){
		return forceNewJaxId?this.genTimeHash():jaxId;
	};

	//---------------------------------------------------------------------------
	//????????????????????????HashID:
	__Proto.genIncHash = function () {
		return "INC"+(nextIncHash++);
	};

	//---------------------------------------------------------------------------
	//????????????????????????HashID:
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
	//??????(??????)?????????ObjHasher
	__Proto.pushObjHasher = function (obj) {
		if (curHasher) {
			hasherList.push(curHasher);
		}
		curHasher = obj;
	};

	//---------------------------------------------------------------------------
	//???????????????ObjHasher???
	__Proto.popObjHasher = function (obj) {
		if(!obj || obj===curHasher){
			curHasher = hasherList.pop();
		}
	};

	//---------------------------------------------------------------------------
	//????????????ObjHasher???????????????????????????
	__Proto.addHashObj = function (id,obj) {
		if (curHasher) {
			curHasher[id]=obj;
		}
	};

	//---------------------------------------------------------------------------
	//??????(??????)?????????View
	__Proto.pushHudView = function (obj) {
		if (curHudView) {
			hudViewList.push(curHudView);
		}
		curHudView = obj;
	};

	//---------------------------------------------------------------------------
	//???????????????HudView???
	__Proto.popHudView = function (obj) {
		curHudView = hudViewList.pop();
	};

	//---------------------------------------------------------------------------
	//???????????????HudView???
	__Proto.getHudView = function () {
		return curHudView;
	};


	//---------------------------------------------------------------------------
	//??????(??????)?????????HudState
	__Proto.pushHudState = function (obj) {
		if (curHudState) {
			hudStateList.push(curHudState);
		}
		curHudState = obj;
	};

	//---------------------------------------------------------------------------
	//???????????????HudState???
	__Proto.popHudState = function (obj) {
		curHudState = hudStateList.pop();
	};

	//---------------------------------------------------------------------------
	//???????????????HudState???
	__Proto.getCurHudState = function () {
		return curHudState;
	};

	//---------------------------------------------------------------------------
	//???????????????HudState
	__Proto.newHudState = function (obj) {
		newHudStates.push(obj);
	};

	//---------------------------------------------------------------------------
	//???????????????HudState???
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
//??????/?????????????????????
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//??????????????????????????????????????????????????????
	__Proto.addOnMouseUp = function (func) {
		if (func._inJAXMouseUp) {
			return;
		}
		func._inJAXMouseUp = 1;
		this.onMouseUps.push(func);
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????????????????
	__Proto.removeOnMouseUp = function (func) {
		var list, i, n;
		func._inJAXMouseUp = 0;
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????:
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
	//??????????????????????????????????????????????????????
	__Proto.addOnMouseMove = function (func) {
		if (func._inJAXMouseMove) {
			return;
		}
		func._inJAXMouseMove = 1;
		this.onMouseMoves.push(func);
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????????????????
	__Proto.removeOnMouseMove = function (func) {
		var list, i, n;
		func._inJAXMouseMove = 0;
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????:
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
			e.stopPropagation();
			e.preventDefault();
		}
	};

	//-----------------------------------------------------------------------
	//????????????
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
//????????????/???????????????:
//***************************************************************************
{
	let OnKeyDowns=[];
	let OnKeyUps=[];

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????
	__Proto.addOnKeyDown = function (func) {
		if (func._inJAXKeyDown) {
			return;
		}
		func._inJAXKeyDown = 1;
		OnKeyDowns.push(func);
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????
	__Proto.removeOnKeyDown = function (func) {
		var list, i, n;
		func._inJAXKeyDown = 0;
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????
	__Proto.addOnKeyUp = function (func) {
		if (func._inJAXKeyUp) {
			return;
		}
		func._inJAXKeyUp = 1;
		OnKeyUps.push(func);
	};

	//-----------------------------------------------------------------------
	//??????????????????????????????????????????
	__Proto.removeOnKeyUp = function (func) {
		var list, i, n;
		func._inJAXKeyUp = 0;
	};

	//-----------------------------------------------------------------------
	//??????????????????
	__Proto.OnKeyDown=function(e){
		let list,i,n,func,appMajor;
		appMajor=e.target===htmlBody;
		list=OnKeyDowns;
		n=list.length;
		for(i=0;i<n;i++){
			func=list[i];
			if(func._inJAXKeyDown){
				if(func(e,appMajor)){
					e.preventDefault();
					e.stopPropagation();
				}
			}else{
				list.splice(i,1);
				i--;n--;
			}
		}
	};

	//-----------------------------------------------------------------------
	//??????????????????
	__Proto.OnKeyUp=function(e){
		let list,i,n,func,appMajor;
		appMajor=e.target===htmlBody;
		list=OnKeyUps;
		n=list.length;
		for(i=0;i<n;i++){
			func=list[i];
			if(func._inJAXKeyUp){
				if(func(e,appMajor)){
					e.preventDefault();
					e.stopPropagation();
				}
			}else{
				list.splice(i,1);
				i--;n--;
			}
		}
	};
}

//***************************************************************************
//????????????????????????????????????:
//***************************************************************************
{
}

//***************************************************************************
//???????????????????????????:
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//????????????????????????CSS?????????:
	JAXEnv.isCSSColorString=function(text){
		var n;
		if(!text.startsWith("#")){
			return 0;
		}
		text=text.substring(1);
		n=text.length;
		if((n===3)||(n===6)||(n===8)){
			return parseInt(text,16)>=0?1:0;
		}
		return 0;
	};

	//-----------------------------------------------------------------------
	//RGBA????????????CSS?????????:
	JAXEnv.encodeColor=function(color,alpha=1){
		var r,g,b,a;
		r=color[0];
		g=color[1];
		b=color[2];
		a=color[3];

		r=r<0?0:(r>255?255:r);
		g=g<0?0:(g>255?255:g);
		b=b<0?0:(b>255?255:b);
		a=a<0?0:(a>1?1:a);
		a*=255;
		r=r<10?("0"+Math.floor(r).toString(16)):(""+Math.floor(r).toString(16));
		g=g<10?("0"+Math.floor(g).toString(16)):(""+Math.floor(g).toString(16));
		b=b<10?("0"+Math.floor(b).toString(16)):(""+Math.floor(b).toString(16));
		a=a<10?("0"+Math.floor(a).toString(16)):(""+Math.floor(a).toString(16));
		return alpha?("#"+r+g+b+a):("#"+r+g+b);
	};

	//-----------------------------------------------------------------------
	//?????????????????????RBGA???:
	JAXEnv.parseColor=function(text){
		var len,r,g,b,a;
		len=text.length;
		if(text.startsWith("#")){
			switch(len){
				case 4://#RGB
					r=text.substring(1,2);
					g=text.substring(2,3);
					b=text.substring(3,4);

					r=parseInt(r,16);
					r=isNaN(r)?0:(r*16+15);

					g=parseInt(g,16);
					g=isNaN(g)?0:(g*16+15);

					b=parseInt(b,16);
					b=isNaN(b)?0:(b*16+15);

					a=1;
					break;
				case 7://#RRGGBB
					r=text.substring(1,3);
					g=text.substring(3,5);
					b=text.substring(5,7);

					r=parseInt(r,16);
					r=isNaN(r)?0:(r);

					g=parseInt(g,16);
					g=isNaN(g)?0:(g);

					b=parseInt(b,16);
					b=isNaN(b)?0:(b);

					a=1;
					break;
				case 9://#RRGGBBAA
					r=text.substring(1,3);
					g=text.substring(3,5);
					b=text.substring(5,7);
					a=text.substring(7,9);

					r=parseInt(r,16);
					r=isNaN(r)?0:(r);

					g=parseInt(g,16);
					g=isNaN(g)?0:(g);

					b=parseInt(b,16);
					b=isNaN(b)?0:(b);

					a=parseInt(a,16);
					a=isNaN(a)?1:(a/255.0);
					break;
				default:
					return [0,0,0,1];
			}
			return [r,g,b,a];
		}
		//TODO: ??????????????????????????????:
		return [0,0,0,1];
	};

	//-----------------------------------------------------------------------
	//???????????????????????????:
	JAXEnv.num2Color=function(num){
		let r,g,b,a;
		num=Math.floor(num);
		a=(num&0xFF000000)>>24;
		r=(num&0xFF0000)>>16;
		g=(num&0xFF00)>>8;
		b=(num&0xFF);
		a=a/255;
		return [r,g,b,a];
	};

	//-----------------------------------------------------------------------
	//???????????????????????????:
	JAXEnv.color2Num=function(color){
		let r,g,b,a;
		r=color[0];
		g=color[1];
		b=color[2];
		a=color[3];
		r=Math.floor(r<0?0:(r>255?255:r));
		g=Math.floor(g<0?0:(g>255?255:g));
		b=Math.floor(b<0?0:(b>255?255:b));
		a*=255;
		a=Math.floor(a<0?0:(a>255?255:a));
		return (a<<24)|(r<<16)|(g<<8)|b;
	};
}

//***************************************************************************
//?????????DYNA??????
//***************************************************************************
{
	//-----------------------------------------------------------------------
	//?????????????????????????????????JAXHudState????????????:
	JAXStateProxy=function(orgObj){
		this.orgObj=orgObj;
	};

	//-----------------------------------------------------------------------
	//JAX????????????????????????:
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
				//??????????????????????????????????????????funcGet:
				return traces?val:funcGet();
			}
		});
		if(traces){
			if(Array.isArray(traces)){
				let i,n,list,stub;
				list=traces;
				if(list.length===2 && typeof(list[1])==="string"){
					//This is oK:
					this.traces=traces=[traces];
				}else {
					for (i = 0; i < n; i++) {
						stub = list[i];
						if(typeof(stub)==="string"){
							list[i] =[null,stub];
						}else if (stub instanceof JAXDataObj || stub instanceof JAXStateProxy) {
							list[i] = [stub, "*"];
						} else if (Array.isArray(stub)) {
							//?????????:
						} else if (stub.obj) {
							//?????????????????????:
							list[i] = [stub.obj, stub.msg || stub.val || "*"];
						} else {
							//???????????????:
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
		}else{
			this.traces=traces===0?0:null;
		}

		//-------------------------------------------------------------------
		//????????????:
		this.trace=function(defaultTgt_,ownerObj,valName,view){
			defaultTgt=defaultTgt_;
			traceView=view;
			if(!traces){
				if(defaultTgt){
					if(defaultTgt instanceof JAXStateProxy){
						defaultTgt.addUpdateFunc(func?func:this.func(ownerObj,valName));
						traced=1;
					}
				}
			}
			if(typeof(traces)==="string"){
				defaultTgt.onNotify(traces,func?func:this.func(ownerObj,valName),view);
				traced=1;
			}else if(Array.isArray(traces)){
				let i,n,stub,tgt,msg;
				n=traces.length;
				for(i=0;i<n;i++){
					stub=traces[i];
					stub[0]=tgt=stub[0]||defaultTgt;
					stub[1]=msg=stub[1]||"*";
					if(tgt) {
						tgt.onNotify(msg, func ? func : this.func(ownerObj, valName), view);
					}
				}
				traced=1;
			}
		};

		//-------------------------------------------------------------------
		//????????????
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
							tgt.offNotify(msg,func,traceView);
						}
					}
				}
			}
			traced=0;
		}
	};
}


export {JAXEnv,$JXV,$V,JAXStateProxy};