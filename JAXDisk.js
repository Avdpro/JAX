import {Store, get, set, del, clear, keys, drop} from "../extern/idb-keyval.js"

var JAXDisk,__Proto;

//***************************************************************************
//JAX系统虚拟磁盘:
//***************************************************************************
JAXDisk=function(diskName)
{
	this.name=diskName;
	this.dbStore=new Store('JAXDisk_'+diskName, diskName);
	this.writeObj=null;
	this.writeVsn=0;
	JAXDisk.diskHash[diskName]=this;
	this.refCount=1;
};

//---------------------------------------------------------------------------
//全部的disk列表
JAXDisk.sysStore=new Store('JAXDisk_', "System");
JAXDisk.disks=null;
JAXDisk.diskHash={};

//***************************************************************************
//JAXDisk系统函数:
//***************************************************************************
{
	//---------------------------------------------------------------------------
	//初始化系统:
	JAXDisk.init=function() {
		if(JAXDisk.disks){
			return new Promise((resolve, reject) => {
				resolve();
			})
		}
		return get("disks", JAXDisk.sysStore).then(list => {
			if (Array.isArray(list)) {
				JAXDisk.disks = new Set(list);
			} else {
				JAXDisk.disks = new Set();
				set("disks", [], JAXDisk.sysStore).then(() => {
				});
			}
		});
	};

	//---------------------------------------------------------------------------
	//创建一个新的disk:
	JAXDisk.newDisk = function (diskName) {
		var self=this;
		return new Promise((resolve, reject) => {
			if (self.disks.has(diskName)) {
				resolve(new JAXDisk(diskName));
			}
			self.disks.add(diskName);
			set('disks', Array.from(self.disks), self.sysStore).then(() => {
				//console.log("Will open new disk: "+diskName);
				let store=new Store('JAXDisk_'+diskName, diskName,1);
				//console.log("Will create root dir: "+diskName);
				set(".",{},store).then(()=>{
					//console.log("Will new JAXDisk obj: "+diskName);
					resolve(new JAXDisk(diskName));
				});
			})
		});
	};

	//---------------------------------------------------------------------------
	//删除一个Disk
	JAXDisk.dropDisk = function (diskName) {
		var self,disk;
		self=this;
		return new Promise((resolve, reject) => {
			if (!self.disks.has(diskName)) {
				reject("Disk not exist!");
			}
			disk = self.openDisk(diskName).then(diskObj=>{
				if(diskObj){
					clear(diskObj.dbStore);
				}
				self.disks.delete(diskName);
				set('disks', Array.from(self.disks), self.sysStore).then(resolve);
			});
		});
	};

	//---------------------------------------------------------------------------
	//打开一个disk:
	JAXDisk.openDisk = function (diskName, create) {
		return new Promise((resolve, reject) => {
			var disk;
			disk = this.diskHash[diskName];
			if (disk) {
				disk.refCount++;
				resolve(disk);
			} else {
				if (!this.disks.has(diskName)) {
					if (create) {
						//return JAXDisk.newDisk(diskName).then(resolve);
						JAXDisk.newDisk(diskName).then(resolve);
					} else {
						reject("Disk not exist!");
					}
				} else {
					resolve(new JAXDisk(diskName));
				}
			}
		});
	};

	//---------------------------------------------------------------------------
	//获得当前disk列表:
	JAXDisk.getDisks=function(){
		return Array.from(this.disks);
	};
}

JAXDisk.prototype=__Proto={};
//***************************************************************************
//JAXDisk对象成员函数:
//***************************************************************************
{
	var divPath=function (dirPath)
	{
		let pos,dirName,upPath;
		//分离目录名和上级目录的路径:
		if(dirPath.endsWith("/")){
			dirPath=dirPath.substring(0,dirPath.length-1);
		}
		pos=dirPath.lastIndexOf("/");
		if(pos>=0){
			dirName=dirPath.substring(pos+1);
			upPath=dirPath.substring(0,pos);
		}else{
			dirName=dirPath;
			upPath="";
		}
		if(upPath.startsWith("/")){
			upPath=upPath.substring(1);
		}
		return [dirName,upPath];
	};

	//-----------------------------------------------------------------------
	//创建一个目录
	__Proto.newDir=function(dirPath)
	{
		var self=this;
		if(dirPath==='.'){
			throw "Error: '.' is not allowed for folder name.";
		}

		if(dirPath.endsWith("/")){
			dirPath=dirPath.substring(0,dirPath.length-1);
		}
		if(dirPath.startsWith("/")){
			dirPath=dirPath.substring(1);
		}

		//console.log("JAXDisk.newDir: newDir: "+dirPath);
		return get(dirPath,self.dbStore).then(curDirObj=>{

			let time=Date.now();

			console.log("JAXDisk.newDir: "+dirPath+", curDirObj: "+curDirObj);
			//目录路径是不是已经存在且是目录:
			if(curDirObj instanceof Uint8Array){
				throw "Can't create dir on file!"
			}else if(typeof(curDirObj)==='object'){
				console.log("JAXDisk.newDir: done1: "+dirPath+"="+curDirObj);
				return curDirObj;
			}

			//目录路径是不是已经存在但不是目录:
			if(curDirObj){
				throw "Error: Path is a file";
			}

			//目录路径不存在，创建目录:
			let upPath,pos,dirName;

			//分离目录名和上级目录的路径:
			[dirName,upPath]=divPath(dirPath);

			//如果有上一级路径，需要确保上一级路径存在:
			if(upPath){
				//有上一级目录，确保上一级目录存在:
				console.log("JAXDisk.newDir: make sure upPath: "+upPath);
				return self.newDir(upPath).then(dirObj=>{
					console.log("JAXDisk.newDir: upPath dirObj: "+dirObj+", dirPath="+dirPath+", upPath="+upPath);
					if(dirObj) {
						//获得了上一级目录的目录对象,将新目录存根加入上一级目录的数组里:
						dirObj[dirName] = {
							name: dirName, dir: 1, createTime: time, modifyTime: time,
						};
						//保存上一级对象
						return set(upPath, dirObj, self.dbStore).then(() => {
							//创建/保存当前目录对象:
							let newDirObj = {};
							set(upPath ? (upPath + "/" + dirName) : dirName, newDirObj, self.dbStore);
							console.log("JAXDisk.newDir: done: "+dirPath+"="+newDirObj);
							return newDirObj;
						});
					}else{
						console.log("JAXDisk.newDir: No dirObj: "+dirPath+"="+upPath);
					}
				});
			}
			//没有有上一级目录，直接创建当前目录对象:
			return get(dirPath,this.dbStore).then((obj)=>{
				if(!obj){
					//创建/保存当前目录对象:
					let newDirObj={};
					return set(dirPath,newDirObj,self.dbStore).then(()=>{
						console.log("newDir created: "+dirPath+"="+newDirObj);
						return newDirObj;
					}).then(()=>{
						return get(".",self.dbStore).then(rootObj=>{
							if(!rootObj){
								throw "disk has no root dir!";
							}
							rootObj[dirName]={
								name:dirName,dir:1,createTime:time,modifyTime:time,
							};
							return set(".",rootObj,self.dbStore).then(()=>{
								console.log("newDir done: "+dirPath+"="+newDirObj);
								return newDirObj;
							});
						});
					});
				}else if(typeof(obj)!=='object'){
					throw "Path is already used!"
				}
				console.log("newDir done: "+dirPath+"="+obj);
				return obj;
			});
		})
	};

	//-----------------------------------------------------------------------
	//删除一个文件或目录
	__Proto.del=function(path,unReg=1)
	{
		var self=this;

		//console.log("Disk.del: "+path);
		if(path.endsWith("/")){
			path=path.substring(0,path.length-1);
		}
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		if(path.startsWith("./")){
			path=path.substring(2);
		}

		return get(path,self.dbStore).then(curObj=>{
			let tgtName,upPath;
			//这个目录/文件本身不存在的, 不算失败:
			if(!curObj){
				return;
			}
			//分离目录名和上级目录的路径:
			[tgtName,upPath]=divPath(path);

			//删除一个单位: 如果是目录，还要删除它的子节点
			function delThisObj(){
				//如果是文件的话，直接删除:
				if(curObj instanceof Uint8Array) {
					return del(path,self.dbStore);
				}
				//这是一个目录，还要删除这个目录里面的文件
				return del(path,self.dbStore).then(()=>{
					let list=[],name,stub,subPath;
					for(name in curObj){
						subPath=upPath+"/"+tgtName+"/"+name;
						list.push(self.del(subPath,0));
					}
					return Promise.all(list);
				});
			}
			if(!upPath){
				upPath=".";
			}
			if(unReg){
				//更新上一级目录里的纪录:
				return get(upPath,self.dbStore).then((upDirObj)=>{
					if(upDirObj){
						//存在上一级目录，删除索引:
						delete upDirObj[tgtName];
						return set(upPath,upDirObj,self.dbStore).then(delThisObj);
					}

					//上一级对象不存在:
					return delThisObj();
				});
			}

			return delThisObj();
		});
	};

	//-----------------------------------------------------------------------
	//保存一个文件,fileObj可以是File对象/字符串/Array对象等，最终保存为字节数组:
	__Proto.saveFile=function(path,fileObj)
	{
		var self,tgtName,upPath,byteAry,time,writeVsn;
		self=this;

		console.log("JAXDisk.saveFile: Disk.saveFile: "+path);
		if(path.endsWith("/")){
			throw "JAXDisk.saveFile: Error: filename can't end with '/'!";
		}
		if(path.startsWith("/")){
			path=path.substring(1);
		}

		[tgtName,upPath]=divPath(path);
		time=Date.now();
		writeVsn=this.writeVsn;

		//把准备好的字节内容写入文件:
		async function saveByteAry(){
			console.log("saveByteAry: "+path+", writeObj: "+(self.writeObj?self.writeObj.filePath:"null"));
			if(self.writeObj && self.writeObj.writeVsn!==writeVsn){
				await self.writeObj;
			}
			set(upPath?(upPath+"/"+tgtName):tgtName,byteAry,self.dbStore);
			if(upPath){
				return get(upPath,self.dbStore).then(dirObj=>{
					if(dirObj){
						let stub=dirObj[tgtName];
						if(stub){
							//更新文件修改时间:
							stub.modifyTime=time;
							stub.size=byteAry.byteLength;
						}else{
							//创建文件:
							dirObj[tgtName]={
								name:tgtName,dir:0,createTime:time,modifyTime:time,size:byteAry.byteLength
							};
						}
						console.log("JAXDisk.saveFile: Update dir obj: "+upPath+"="+JSON.stringify(dirObj));
						return set(upPath,dirObj,self.dbStore);
					}else{
						console.log("JAXDisk.saveFile: Will new dir obj: "+upPath);
						return self.newDir(upPath).then(dirObj=>{
							if(dirObj) {
								dirObj[tgtName] = {
									name: tgtName, dir: 0, createTime: time, modifyTime: time, size: byteAry.byteLength
								};
								console.log("JAXDisk.saveFile: New dir obj: "+upPath+"="+JSON.stringify(dirObj));
								return set(upPath,dirObj,self.dbStore);
							}else{
								console.log("JAXDisk.saveFile: Error: no dir-obj: "+upPath);
							}
						});
					}
				});
			}else{
				//这是根目录
				return get(".",self.dbStore).then(dirObj=>{
					if(dirObj){
						let stub=dirObj[tgtName];
						if(stub){
							//更新文件修改时间:
							stub.modifyTime=time;
							stub.size=byteAry.byteLength;
						}else{
							//创建文件:
							dirObj[tgtName]={
								name:tgtName,dir:0,createTime:time,modifyTime:time,size:byteAry.byteLength
							}
						}
						console.log("New dir obj: /="+JSON.stringify(dirObj));
						return set(".",dirObj,self.dbStore);
					}
				});
			}
		}

		//首先把对象转换为ByteArray
		if(typeof(fileObj)==='string'){
			let encoder=new TextEncoder();
			byteAry=encoder.encode(fileObj);
			self.writeObj=saveByteAry();
			self.writeObj.filePath=path;
			self.writeObj.writeVsn=self.writeVsn++;
			return self.writeObj;
		}else if(fileObj instanceof File){
			this.writeObj=fileObj.arrayBuffer().then(buf=>{
				byteAry=new Uint8Array(buf);
				return saveByteAry();
			});
			self.writeObj.filePath=path;
			self.writeObj.writeVsn=self.writeVsn++;
			return self.writeObj;
		}else if(fileObj instanceof Uint8Array){
			byteAry=fileObj;
			self.writeObj=saveByteAry();
			self.writeObj.filePath=path;
			self.writeObj.writeVsn=self.writeVsn++;
			return self.writeObj;
		}
	};

	//-----------------------------------------------------------------------
	//读取一个文件二进制数据
	__Proto.loadFile=function(path)
	{
		var self;
		self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		return get(path,self.dbStore).then(fileObj=>{
			if(fileObj instanceof Uint8Array){
				return fileObj;
			}
			return null;
		});
	};

	//-----------------------------------------------------------------------
	//读取一个文件文本
	__Proto.loadText=function(path)
	{
		var self;
		self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		return get(path,self.dbStore).then(fileObj=>{
			if(fileObj instanceof Uint8Array){
				var enc = new TextDecoder("utf-8");
				return enc.decode(fileObj);
			}
			return null;
		});
	};

	//-----------------------------------------------------------------------
	//列出某个Path下的文件，如果不是目录，返回空，如果是目录，返回文件vo列表:
	__Proto.getEntries=function(path)
	{
		var self;
		self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		if(!path){
			path='.';
		}
		return get(path,self.dbStore).then(fileObj=>{
			if(fileObj instanceof Uint8Array || !fileObj){
				return null;//这是文件，不是目录, 或者路径不存在
			}
			return Object.values(fileObj);
		});
	};

	//-----------------------------------------------------------------------
	//看看某个文件是不是存在:
	__Proto.isExist=function(path)
	{
		var self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		if(!path){
			path='.';
		}
		return get(path,self.dbStore).then(fileObj=>{
			return !!fileObj;
		});
	};

	//-----------------------------------------------------------------------
	//copy一个文件/目录:
	__Proto.copyFile=function(path,newPath,overwrite=1)
	{
		var self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		if(path.endsWith("/")){
			path=path.substring(0,path.length-1);
		}
		if(!path){
			path='.';
		}
		return get(path,self.dbStore).then(fileObj=>{
			if(!fileObj){
				throw "Missing source file: "+path;
			}
			if(fileObj instanceof Uint8Array){
				//copy 文件
				return self.isExist(newPath).then(hasFile=>{
					if(hasFile && (!overwrite)){
						throw "Target path taken!"
					}
					return self.saveFile(newPath,fileObj);
				});
			}else{
				return self.newDir(newPath).then(()=>{
					let subs,subName,list;
					list=[];
					subs=Object.keys(fileObj);
					list.push(self.newDir(newPath));
					for(subName of subs){
						list.push(self.copyFile(path+"/"+subName,newPath+"/"+subName,overwrite));
					}
					return Promise.all(list).then(()=>{
						set(newPath,fileObj,self.dbStore)
					});
				});
			}
		});
	};

	//-----------------------------------------------------------------------
	//改名一个文件/目录:
	__Proto.rename=function(path,newPath)
	{
		var self=this;
		if(path.startsWith("/")){
			path=path.substring(1);
		}
		if(path.endsWith("/")){
			path=path.substring(0,path.length-1);
		}
		if(!path){
			path='.';
		}
		return get(path,self.dbStore).then(fileObj=>{
			if(!fileObj){
				throw "Missing source file.";
			}
			return self.copyFile(path,newPath).then(()=>{
				self.del(path);
			});
		});
	};

	//-----------------------------------------------------------------------
	//把Zip展开在指定路径里:
	__Proto.zip2Path=function()
	{
		//TODO: Code this:
	};

	//-----------------------------------------------------------------------
	//指定路径压缩为Zip:
	__Proto.path2Zip=function()
	{
		//TODO: Code this:
	}
}

export {JAXDisk};
