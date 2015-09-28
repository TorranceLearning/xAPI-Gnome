$(function() {

	Parse.$ = jQuery;
	Parse.initialize("Y4IkC78famIP7txt01B3kQmrjm0b19SqYyed8jxR", "QdaBkWXDgW0t2c8pHgdkiDo9C7hKvK18eHj35rKR");

	var tincan = new TinCan({
		recordStores: [{
			// Dave Smith's SCORM Cloud account
			endpoint: "https://cloud.scorm.com/tc/3GBY5QUCKC/sandbox/", 
			auth: "Basic eHlRZURpZG8wYXBWbm9JUnRZczpoM3F1NzJaaXRsMU5wdGpqd21J",
			allowFail: false
		},{
			// TorranceLearning SCORM Cloud account
			endpoint: "https://cloud.scorm.com/tc/58WJPIFQVJ/sandbox/", 
			auth: "Basic NThXSlBJRlFWSjpNQk56NnF3c0tNWFQ5aTFiVFBnaE9EcGwxRzRHTmNpS3p1MFhxakZN",
			allowFail: false
		}],
		context: {	}
	});	

  // Todo Model
  // Parse's "Object" is analogous to Backbone's "Model"
  // ----------
  // Our basic Todo model has `content`, `order`, and `done` attributes.
  	var Todo = Parse.Object.extend("testing", {
//  var Todo = Parse.Object.extend("Gnomes", {
    // Default attributes for the todo.
    defaults: {
      content: "empty todo...",
      done: false,
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("content")) {
        this.set({"content": this.defaults.content});
      }
    },

    // Toggle the `done` state of this todo item.
    finish: function() {
      this.save({done: !this.get("done")});
    }
	, //MK added
	tincanCreate: function() {
	  	var username = Parse.User.current().attributes.username;
		var email = Parse.User.current().attributes.email;
		var checklistItem = this._serverData.content;	
		if (this._serverData.type==="manual") { console.log("This is a manual item")}
		if (this._serverData.type==="qr") {console.log("This is a QR code item")}
		if (this._serverData.type==="nfc") {console.log("This is an NFC item")}
		
		// MK initial test
//		tincan.sendStatement({
//				actor: {name: username, mbox: email},
//				verb: {id: "http://adlnet.gov/expapi/verbs/completed", display: {und: "completed"}},
//				target: {
//					id: "http://www.torrancelearning.com/xapi/gnome",
//					definition: {
//						name: {und: checklistItem},
//						description: {und: "Right now, this is a manual checklist item."},
//					}					
//				}
//			}
//		);		
	}
  });

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // Todo Collection
  // ---------------

  var TodoList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var TodoView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .finishBtn"              	: "toggleDone",
      "click .unique"              		: "toggleDone",
      "click .view"             		: "popup",
    },
	
    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Todo and a TodoView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
 //     _.bindAll(this, 'render', 'close', 'remove');
      _.bindAll(this, 'render', 'remove');
      this.model.bind('change', this.render);
      //this.model.bind('destroy', this.remove);
    },
	
	popup: function() {
		if (!window.cordova) {alert(this.model.get('moreInfo'))}
		else {
		  navigator.notification.confirm(
			  this.model.get('moreInfo'),  // message
			  function() {},         // callback
			  'xAPI Gnome',            // title
			  ['Close', 'More']                  // buttonName
		  );
		}
	},
	
    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
	  // $('.sortable').sortable(); // MK added (jquery.sortable.js)

	  //MK added - assigns classes to items flagged "true" in Parse for styling and JS hooks.
		if (this.model.get('type')==="manual" && this.model.get('done')===false) { 
			$('<input>').attr({type:'checkbox', class:'finishBtn'}).appendTo(this.el);
		}	 
		 
		if (this.model.get("done")===true) {
			$(this.el).addClass("completed");
		}
	  
		var typeClasses = {
        	"manual": 	"manual",
   			"qr": 		"qr",
   			"nfc": 		"nfc",
			"beacon": 	"beacon",
			"video":	"video",
		};
	
		//TODO now that the classes are changed to conform this can be simplified
		for (var key in typeClasses) {
			if (typeClasses.hasOwnProperty(key)) {
				if (this.model.get("type")===key) {
					this.$(".unique").val(this.model.get('uniqueID'));	
					$(this.el).addClass(typeClasses[key]);
				}
			}
		}
		
		var iconClasses = {
         	"done": 	"fa-check-square-o",
			"manual":	"fa-square-o",
   			"qr": 		"fa-qrcode",
   			"nfc": 		"fa-rotate-90 fa-wifi",
			"beacon": 	"fa-rotate-90 fa-wifi",
			"video":	"fa-video-camera",
			"url":		"fa-link",
			"freeform":	"fa-comment",
			"question":	"fa-question-circle",
			"course":	"fa-external-link",
		};		
		for (var key in iconClasses) {
			if (iconClasses.hasOwnProperty(key)) {
				if (this.model.get("type")===key) {
					$(this.el).find('.icon').addClass(iconClasses[key]);
				}
			}
		}		

		//MK added - converts URLs in strings to actual links using Autolinker.js
		var autolinker = new Autolinker( {
			newWindow : true,
			truncate  : 30,
			className : "autolinks"
		} );
		
		var listContent = $(this.el).html();
		listContent = autolinker.link( listContent );
		$(this.el).html(listContent);
		
      return this;
    }, // end render function
	
    // Toggle the `"done"` state of the model.
    toggleDone: function() {
   		this.model.finish();
		$(this.el).removeClass('manual');
		if (window.cordova) {
			navigator.notification.vibrate(100);    
		}
		this.tincanCreate();
    },
	
	tincanCreate: function() {
	  	var username = Parse.User.current().attributes.username;
		var email = Parse.User.current().attributes.email;
		var checklistItem = this._serverData.content;	
		if (this._serverData.type==="manual") { console.log("This is a manual item")}
		if (this._serverData.type==="qr") {console.log("This is a QR code item")}
		if (this._serverData.type==="nfc") {console.log("This is an NFC item")}
		
		// MK initial test
//		tincan.sendStatement({
//				actor: {name: username, mbox: email},
//				verb: {id: "http://adlnet.gov/expapi/verbs/completed", display: {und: "completed"}},
//				target: {
//					id: "http://www.torrancelearning.com/xapi/gnome",
//					definition: {
//						name: {und: checklistItem},
//						description: {und: "Right now, this is a manual checklist item."},
//					}					
//				}
//			}
//		);		
	}	
  }); // end TodoView

  // The Application
  // ---------------

  // The main view that lets a user manage their todo items
  var ManageTodosView = Parse.View.extend({

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
	  "click #startScan"		: "scanQR", // MK added
	  "click #refreshBtn"		: "refreshData", // MK added
      "click .log-out"			: "logOut",
      "click ul#filters a"		: "selectFilter"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved to Parse.
    initialize: function() {
      var self = this;

      _.bindAll(this, 'scanQR', 'initCordovaPlugs', 'initBeacon', 'monitorBeacon', 'rangeBeacon', 
	  'onNdef', 'decodePayload', 'refreshData', 'addOne', 'addAll', 'addSome', 'render', 'logOut');

      // Main todo management template
      this.$el.html(_.template($("#manage-todos-template").html()));
	  
      // Create our collection of Todos
      this.todos = new TodoList;
	  

      // Setup the query for the collection to look for todos from the current user
      this.todos.query = new Parse.Query(Todo);
      this.todos.query.equalTo("user", Parse.User.current());
	  // Could probably work with the above to have an "admin" version to switch between different users' lists.
	  var testingTitle = this.todos.query.equalTo("className").className;
	  if (testingTitle === "testing") {
		  $('.title h1').html(testingTitle);
		}
	  else {
		  $('.title h1').html(Parse.User.current().attributes.username + "'s checklist");
	  }
	  
      this.todos.bind('add',     this.addOne);
      this.todos.bind('reset',   this.addAll);
      this.todos.bind('all',     this.render);

      // Fetch all the todo items for this user
      this.todos.fetch();
	  
      state.on("change", this.filter, this);
	  
	  document.addEventListener('deviceready', this.initCordovaPlugs, false);
	  
    }, // end initialize
	
	initCordovaPlugs: function() {
		console.log("initCordovaPlugs");
		//this.initBeacon();
		this.nfcListen();
	},
	
	initBeacon: function() {
		console.log("initBeacon");
	  
		var delegate = new cordova.plugins.locationManager.Delegate();
		
		delegate.didDetermineStateForRegion = function (pluginResult) {
		
			//logToDom('[DOM] didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
			console.log('[DOM] didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
			cordova.plugins.locationManager.appendToDeviceLog('[DOM] didDetermineStateForRegion: '
				+ JSON.stringify(pluginResult));
		};
		
		delegate.didStartMonitoringForRegion = function (pluginResult) {
			console.log('didStartMonitoringForRegion:', pluginResult);
		
			//logToDom('didStartMonitoringForRegion:' + JSON.stringify(pluginResult));
		};
		
		delegate.didRangeBeaconsInRegion = function (pluginResult) {
			console.log('[DOM] didRangeBeaconsInRegion: ', pluginResult);
			//logToDom('[DOM] didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
		};
		
		var uuid = '206a6e55-9ed9-4216-8559-2027ce3447c4'; // mandatory
		var identifier = 'Finbert'; // mandatory
		var major = 3869;
		var minor = 1;
		var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);
		
		cordova.plugins.locationManager.setDelegate(delegate);
		
		this.monitorBeacon(beaconRegion);
		this.rangeBeacon(beaconRegion);
		// required in iOS 8+
		//cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
		// or cordova.plugins.locationManager.requestAlwaysAuthorization()
	
	},
	
	monitorBeacon: function(beaconRegion) {
		console.log("monitorBeacon");
	  	cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
		  .fail(console.error)
		  .done();
	},
	
	rangeBeacon: function(beaconRegion) {
		console.log("rangeBeacon");
		cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
		  .fail(console.error)
		  .done();
	},
	
	nfcListen: function() {
		nfc.addNdefListener(
			this.onNdef,
            function() {console.log("Listening for NDEF tags.");},
            failure
        );
		function failure(reason) {
            navigator.notification.alert(reason, function() {}, "There was a problem");
        }
	},
	
	onNdef: function (nfcEvent) {
		var uniqueID = this.decodePayload(nfcEvent.tag.ndefMessage[0]);
			nfcListItem = this.$(".nfc p"),
			nfcItems = this.$(".nfc .unique");
		for (i=0; i < nfcItems.length; i++) {
			var nfcItemText = nfcItems[i].value;
			if (uniqueID === nfcItemText) {
				nfcItems[i].click();
			}				
		};
    },
	
	decodePayload: function (record) {
		var recordType = nfc.bytesToString(record.type),
			payload;
		if (recordType === "T") {
			var langCodeLength = record.payload[0],
			text = record.payload.slice((1 + langCodeLength), record.payload.length);
			payload = nfc.bytesToString(text);
		} else if (recordType === "U") {
			var identifierCode = record.payload.shift(),
			uri =  nfc.bytesToString(record.payload);
			if (identifierCode !== 0) {
				console.log("WARNING: uri needs to be decoded");
			}
			payload = uri;
		} else {
			// kludge assume we can treat as String
			payload = nfc.bytesToString(record.payload); 
		}
	
		return payload;
	},
	
	//MK added QR scanning
	scanQR: function() {
		if (!window.cordova) {alert("Sorry, this needs the mobile app to access the QR reader.")}
		else {
		  cordova.plugins.barcodeScanner.scan(
			  function (result) {
				  var scanQRText = result.text,
					  qrListItem = this.$(".qr p"),
					  qrItems = this.$(".qr .unique");
				  for (i=0; i < qrItems.length; i++) {
					  var qrItemText = qrItems[i].value;
					  if (scanQRText === qrItemText) {
						  qrItems[i].click();
					  }				
				  };
			  }, 
			  function (error) { alert("Scanning failed: " + error); }		
		  );
		}
	},	
	
	refreshData: function() {
		this.initialize();
	},
	
    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = this.todos.done().length;
      var remaining = this.todos.remaining().length;

      this.$('#todo-stats').html(this.statsTemplate({
        total:      this.todos.length,
        done:       done,
        remaining:  remaining
      }));

      this.delegateEvents();
    },

    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
      var el = $(e.target);
      var filterValue = el.attr("id");
      state.set({filter: filterValue});
      Parse.history.navigate(filterValue);
    },

    filter: function() {
      var filterValue = state.get("filter");
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#" + filterValue).addClass("selected");
      if (filterValue === "all") {
        this.addAll();
      } else if (filterValue === "completed") {
        this.addSome(function(item) { return item.get('done') });
      } else {
        this.addSome(function(item) { return !item.get('done') });
      }
    },

    // Resets the filters to display all todos
    resetFilters: function() {
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#all").addClass("selected");
      this.addAll();
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
      this.$("#todo-list").html("");
      this.todos.each(this.addOne);
    },

    // Only adds some todos, based on a filtering function that is passed in
    addSome: function(filter) {
      var self = this;
      this.$("#todo-list").html("");
      this.todos.chain().filter(filter).each(function(item) { self.addOne(item) });
    },
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageTodosView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          self.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var email = this.$("#signup-email").val(); // MK added
      var password = this.$("#signup-password").val();
      
      Parse.User.signUp(username, password, { email: email }, {
        success: function(user) {
          new ManageTodosView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(_.escape(error.message)).show();
          self.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
		//currentUser = Parse.User.current().attributes.username;  
        new ManageTodosView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});
