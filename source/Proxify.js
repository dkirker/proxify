enyo.kind({
	name: "MyApps.AddList",
	kind: enyo.VFlexBox,

	components: [
		{kind: "Scroller", flex: 1, className: "box-center", autoHorizontal: false, horizontal: false, components: [
			{kind: "RowGroup", caption: "Name", components: [
				{name: "proxyName", kind: "Input", changeOnInput: true, onchange: "inputOnChange", flex: 1, caption: "Name", hint: $L("Name")},
			]},
			{kind: "RowGroup", caption: "Host", components: [
				{name: "proxyAddress", kind: "Input", hint: $L("Address"), flex: 1},
				{name: "proxyPort", kind: "Input", hint: $L("Port"), flex: 1}
			]},
			{kind: "RowGroup", caption: "Authentication", components: [
				{name: "proxyUsername", kind: "Input", hint: $L("Username"), flex: 1},
				{name: "proxyPassword", kind: "Input", hint: $L("Password"), flex: 1}
			]},
			{kind: "Button", name: "add", disabled: true, flex: 1, caption: "Save", onclick: "addProxy"},
			{kind: "Button", name: "cancel", flex: 1, caption: "Cancel", onclick: "cancelAddProxy"},
			{kind: "Dialog", components: [
				{name: "dialogContent", layoutKind: "HFlexLayout", pack: "center", style: "Padding-left: 10px"},
				{kind: "Button", flex: 1, caption: "OK", onclick: "closeDialog"},
			]}
		]}
	],
	
	addProxy: function(inSender, inEvent){
		var name = this.$.proxyName.getValue();
		for (var i = 0; i < MyApps.AddList.data.length; i++) {
			var record = MyApps.AddList.data[i]
			if (record.proxyName == name) {
				this.$.dialog.open();
				this.$.dialogContent.setContent('A proxy with the name "'+name+'" already exists!');
				return;
			};
		};
		
		console.log("addProxy adding " + name);

		MyApps.Proxify.pane.back();
		var proxy = this.$.proxyAddress.getValue();
		var port = this.$.proxyPort.getValue();
		try {
			MyApps.List.db.transaction(
				function (tx) {
					tx.executeSql('INSERT INTO table1 (proxyName, proxyAddress, proxyPort) VALUES ("' + name + '","' + proxy + '","' + port + '");');
					console.log("Executing");
				}.bind(this)
			);
		}
		catch (e)
		{
			console.log("ListAdd addProxy Exception: " + e);
			//this.$.results.setContent(e); 
		}
	},
	cancelAddProxy: function(inSender, inEvent) {
		MyApps.Proxify.pane.back();
	},
	inputOnChange :function(inSender) {
		if (inSender.getValue() != "") {
			this.$.add.setDisabled(false);
		}
		else {
			this.$.add.setDisabled(true);
		}
	},
	
	closeDialog: function() {
		this.$.dialog.close();
		MyApps.Proxify.pane.back();
	},
}),

enyo.kind({
	name: "MyApps.List",
	kind: enyo.VFlexBox,

	events: {
		onProxyEdit: "",
		onProxyAdd: ""
	},

	components: [
		{kind: "Scroller", flex: 1, className: "box-center", horizontal: false, components: [
			{kind: "VFlexBox", components: [
				{ kind: "RowGroup", name: "proxyListGroup",  caption: $L("Available Proxies"), layoutKind: "VFlexLayout", showing: true, components: [
					{kind: "RowItem", className: "enyo-first", onclick: "selectOff", Xonmousedown: "selectOff", tapHighlight: true, components: [
						{layoutKind: "HFlexLayout", align: "center", components: [
							{layoutKind: "VFlexLayout", flex: 1, components: [
								{content: "Off"},
							]},
							{name: "checkOff", kind: "Image", layoutKind: "HFlexLayout", align: "right", src: "images/selection-checkmark.png"},
						]},
					]},
					{name: "proxyList", className: "list", kind: "VirtualRepeater", onSetupRow: "listSetupRow", flex: 1, components: [
						{name: "proxyRow", kind: "SwipeableItem", layoutKind: "HFlexLayout", pack: "center", tapHighlight: true, confirmRequired: true, confirmCaption: $L("Delete"), onConfirm: "deleteItem", onclick: "selectItem", Xonmousedown: "selectItem", components: [
							{layoutKind: "VFlexLayout", flex: 1, components: [
								{name: "listProxyName"},
								{name: "address"},
							]},
							{name: "check", kind: "Image", layoutKind: "HFlexLayout", align: "right", src: "images/selection-checkmark.png"},
							{name: "proxyInfo", className: "info-icon-enabled", showing: true, style: "margin: 5px 3px 0px 0px;", onmouseup: "proxyEdit"}
						]}
					]},
					{ kind: "RowItem", className: "enyo-last", layoutKind: "HFlexLayout", tapHighlight: true, onmouseup: "proxyAdd", components: [
					 	{ className: "proxy-add-icon", style: "margin: 3px 0;" },
					 	{ content: $L( "Add Proxy" ), className: "pref-text-normal", style: "padding-left:10px;" }
					]}

				]}
			]}
		]},
		
		/*{name: "statusText", content: "Select one"},*/
		
		{kind: "PalmService",
		name: "setProxy",
		service: "palm://com.palm.connectionmanager/",
		method: "configureNwProxies",
		onSuccess: "proxyApplied",
		onFailure: "proxyApplicationFailed"},
	],
	
	set_proxy: function(action, address, port) {
		if (MyApps.AddList.data.majorVersion < 3) {
			this.$.setProxy.call({
				"action":action,
				"proxyInfo":{"proxyScope":"default","proxyServer":address,"proxyPort":port}
			});
		}
		else {
			this.$.setProxy.call({
				"action":action,
				"proxyInfo":{"proxyConfigType":"manualProxy","proxyScope":"default","proxyServer":address,"proxyPort":port}
			});
			//this.$.statusText.setContent(address);
		}
	},
	
	showingChanged: function() {
		try {
			MyApps.List.db.transaction(
				function (tx) {
					tx.executeSql('select * from table1', [], enyo.bind(this,this.queryResponse), enyo.bind(this,this.errorHandler)); 
					tx.executeSql('select * from table2', [], enyo.bind(this,this.responseCheckIcon), []); 
				}.bind(this)
			);
		}
		catch (e)
		{
			//this.$.results.setContent(e);      
		}
	},
	
	create: function() {
		MyApps.AddList.data = [];
		this.inherited(arguments);
	},
	
	ready: function() {
		var info = enyo.fetchDeviceInfo();
		if (info) {
			MyApps.AddList.data.majorVersion = info.platformVersionMajor
			//this.$.statusText.setContent(info.platformVersionMajor);
		}
		
		try {
			MyApps.List.db = openDatabase('ProxifyDB', '', 'Proxify Data Store', 65536);
			MyApps.List.db.transaction(
				function (tx) {
					// Create the table if not already there
					tx.executeSql('CREATE TABLE table1 (proxyName, proxyAddress TEXT NOT NULL DEFAULT "nothing", proxyPort TEXT NOT NULL DEFAULT "nothing")', [], [], [])
					tx.executeSql('CREATE TABLE table2 (selected INTEGER, previous INTEGER)', [], [], [])
				 
					//Insert value
					//tx.executeSql('INSERT INTO table1 (proxyName, proxyAddress, proxyPort) VALUES ("name1","proxy1","port1")', [], [], [])
				 
					//SELECT query to display data
					tx.executeSql('select * from table1', [], enyo.bind(this,this.queryResponse), enyo.bind(this,this.errorHandler));
					//restore data for checkicon
					tx.executeSql('select * from table2', [], enyo.bind(this,this.responseCheckIcon), []); 
				
				}.bind(this)
			);
		}
		catch (e)
		{
			console.log("List ready Exception: " + e);
			//this.$.results.setContent(e);      
		}
	},

	responseCheckIcon: function(transaction, results) {
		var length = results.rows.length
		if (length > 0) {
			MyApps.AddList.data.selected = results.rows.item(0).selected
			MyApps.AddList.data.previous = results.rows.item(0).previous
		}
		this.$.proxyList.render();
	},
	
	queryResponse: function(transaction, results) {
		var list = [];
		var length = results.rows.length// + 1
		//alert(results.rows.length);
		for (var i = 0; i < length; i++) {
			console.log("row: " + JSON.stringify(results.rows.item(i)));
			list[i] = results.rows.item(i);
		}
		MyApps.AddList.data = list; //set list to data
		//this.$.proxyList.render();
	},
	
	listSetupRow: function(inSender, inIndex) {
		var record = MyApps.AddList.data[inIndex]; //set data arry values to record
		if (record) {
			this.$.proxyRow.show();

			if (MyApps.AddList.data.selected != inIndex) {
				this.$.check.hide();
			}
			else {
				this.$.checkOff.hide();
			}
			
			this.$.listProxyName.setContent(record.proxyName);
			//this.$.address.setContent(record.proxyAddress + ":" + record.proxyPort);
			return true;
		} else {
			this.$.proxyRow.hide();
		}
	},
	
	selectOff: function() {
		this.$.checkOff.show();
		
		MyApps.AddList.data.previous = MyApps.AddList.data.selected
		
		this.$.proxyList.prepareRow(MyApps.AddList.data.previous);
		this.$.check.hide();
		
		var address;
		var port;
		var record = MyApps.AddList.data[MyApps.AddList.data.previous]
		if (record) {
			address = record.proxyAddress
			port = parseInt(record.proxyPort)
		}
		this.set_proxy("rmv", address, port);
		
		try {
			MyApps.List.db.transaction(
				function (tx) {
					tx.executeSql('DELETE FROM table2;', [], [], []);
					tx.executeSql('INSERT INTO table2 (previous) VALUES ("'+MyApps.AddList.data.previous+'")', [], [], [])
				}.bind(this)
			);
		}
		catch (e)
		{
			//this.$.results.setContent(e);      
		}
	},
	
	selectItem: function(inSender, inEvent) {
		this.$.checkOff.hide();
		
		MyApps.AddList.data.previous = MyApps.AddList.data.selected
		MyApps.AddList.data.selected = inEvent.rowIndex
		
		this.$.proxyList.controlsToRow(MyApps.AddList.data.previous);
		this.$.check.hide();
		
		this.$.proxyList.controlsToRow(inEvent.rowIndex);
		this.$.check.show();
		
		if (MyApps.AddList.data.previous) {	
			var address;
			var port;
			var record = MyApps.AddList.data[MyApps.AddList.data.previous]
			if (record) {
				address = record.proxyAddress
				port = parseInt(record.proxyPort)
			}
			this.set_proxy("rmv", address, port);
		}
		var record = MyApps.AddList.data[MyApps.AddList.data.selected]
		if (record.proxyName != "Off") {
			var address = MyApps.AddList.data[MyApps.AddList.data.selected].proxyAddress
			var port = parseInt(MyApps.AddList.data[MyApps.AddList.data.selected].proxyPort)
			this.set_proxy("add", address, port);
		}
		
		try {
			MyApps.List.db.transaction(
				function (tx) {
					tx.executeSql('DELETE FROM table2;', [], [], []);
					tx.executeSql('INSERT INTO table2 (selected, previous) VALUES ("'+inEvent.rowIndex+'","'+MyApps.AddList.data.previous+'")', [], [], [])
				}.bind(this)
			);
		}
		catch (e)
		{
			console.log("List selectItem Exception: " + e);
			//this.$.results.setContent(e);      
		}
		
	},

	proxyApplied: function(inSender, inResponse) {
		
	},
	proxyApplicationFailed: function(inSender, inResonse) {
		
	},
	
	deleteItem: function(inSender, inIndex) {
		var record = MyApps.AddList.data[inIndex];
		var name;
		var address;
		var port;

		if (record) {
			name = record.proxyName;
			address = record.proxyAddress;
			port = parseInt(record.proxyPort);
	
			console.log("List deleteItem deleting " + name);

			if (MyApps.AddList.data.selected == inIndex) {
				this.set_proxy("rmv", address, port);
			}
	
			try {
				MyApps.List.db.transaction(
					function (tx) {
						tx.executeSql('DELETE FROM table1 WHERE proxyName="'+name+'";', [], [], []);
						tx.executeSql('select * from table1', [], enyo.bind(this,this.queryResponse), enyo.bind(this,this.errorHandler)); 
					}.bind(this)
				);
			}
			catch (e)
			{
				console.log("List deleteItem Exception: " + e);
				//this.$.results.setContent(e);      
			}
		} else {
			console.log("Error! record " + inIndex + " not found!");
		}
	},
	proxyEdit: function(inSender, inEvent, inIndex) {
		this.doProxyEdit(inIndex);
	},
	proxyAdd: function(inSender, inEvent, inIndex) {
		console.log("proxyAdd called - calling doProxyAdd");
		this.doProxyAdd();
	}
}),

enyo.kind({
	name: "MyApps.Proxify",
	kind: enyo.VFlexBox,

	components: [
		{kind: "ApplicationEvents", onLoad: "appLoaded"},
		{kind: "AppMenu", name: "appMenu", components: [
			{ kind: "HelpMenu", target: "http://openmobl.mobi/help/proxify/" }
		]},

		{kind: "Toolbar", name: "header", className: "header enyo-toolbar-light", pack: "center", components: [
			{ kind: "HFlexBox", pack: "center", align: "center", components: [
			 	{ className: "header-icon" },
			 	{ content: $L( "Web Proxy" ), style: "padding-left:10px;" }
			]},
			/*{ flex: 1, components: [{kind: "ToggleButton", flex: 1, name: "proxyToggle", style: "float: right;", showing: true, onChange: "handleProxyToggle" } ] }*/
			/*{name: "edit", kind: "Button", onclick: "edit"},*/
		]},
		{className:"header-shadow"},
		
 		{name: "pane", kind: "Pane", flex: 1, onSelectView: "viewSelected", components: [
			{name: "list", kind: "MyApps.List", onProxyAdd: "handleProxyAdd", onProxyEdit: "handleProxyEdit"},
			{name: "add", kind: "MyApps.AddList"},
		]},
		
		/*{name: "statusText", content: "Select one"},*/
	],
	
	ready: function() {
		this.$.pane.selectViewByName("list");
		
		var info = enyo.fetchDeviceInfo();
		if (info) {
			var majorVersion = info.platformVersionMajor
			
			//alert(majorVersion);
			//this.$.statusText.setContent(majorVersion);
		}
	},
	
	viewSelected: function(inSender, inView) {
		/*if (inView == this.$.list) {
			this.$.proxyToggle.show();
		}
		else if (inView == this.$.add) {
			this.$.proxyToggle.hide();
		}*/
	},

	handleProxyToggle: function() {

	},
	
	edit: function() {
		MyApps.Proxify.pane = this.$.pane;
		this.$.pane.selectViewByName("add");
	},

	handleProxyEdit: function(inSender, inEvent) {
		console.log("handleProxyEdit");
		this.edit();
	},

	handleProxyAdd: function(inSender, inEvent) {
		console.log("handleProxyAdd");
		this.edit();
	}
});
