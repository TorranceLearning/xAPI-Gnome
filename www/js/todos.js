/*global $, window, document, navigator, setInterval, clearInterval, Uint8Array, location*/
/*global Parse, jQuery, TinCan, evothings, cordova, locationManager, nfc, bootbox, dweetio, twttr, Snap, _*/

$(function () {

	Parse.$ = jQuery;
	Parse.initialize("Y4IkC78famIP7txt01B3kQmrjm0b19SqYyed8jxR", "QdaBkWXDgW0t2c8pHgdkiDo9C7hKvK18eHj35rKR");

	var tincan = new TinCan({
		recordStores: [{

			// TorranceLearning SCORM Cloud account
			endpoint: "ENTER ENDPOINT HERE",
			auth: "ENTER BASIC AUTH HERE",
			allowFail: false
		}],
		context: {
			contextActivities: {
				parent: {
					id: "http://www.gnomeland.com/checklist/new-hire"
				}
			}
		}
	});
	//TinCan.DEBUG=true;

	var userClassName = null;

	if (!Parse.User.current()) {
		userClassName = "temp";
//		new LogInView();
	} else {
//		userClassName = Parse.User.current().getUsername();
		assignUsername();
	}

	function assignUsername() {
		userClassName = Parse.User.current().getUsername();
//		console.log(userClassName);
	}

	var dispatcher = _.clone( Parse.Events ); // to trigger events between views

	// Todo Model
	var Todo = Parse.Object.extend(userClassName, {
	//var Todo = Parse.Object.extend("testing", {
		//  var Todo = Parse.Object.extend("Gnomes", {
		// Default attributes for the todo.
		defaults: {
			content: "empty todo...",
			done: false
		},

		// Ensure that each todo created has `content`.
		initialize: function () {
			if (!this.get("content")) {
				this.set({
					"content": this.defaults.content
				});
			}
//
//			var email = Parse.User.current().attributes.email;
////			console.log(email);
//			this.set("email", email);
//			console.log(this.get("email"));
		},

		// Toggle the `done` state of this todo item.
		finish: function () {
			//this.save({done: !this.get("done")});// turn off toggle
			this.save({
				done: true
			});
		}

	}); //end Todo object/model


	// This is the transient application state, not persisted on Parse
	var AppState = Parse.Object.extend("AppState", {
		defaults: {filter: "all"}
	});

	// Todo Collection
	// ---------------

	var TodoList = Parse.Collection.extend({

		// Reference to this collection's model.
//		model: Todo,
		model: new Todo(),

		// Filter down the list of all todo items that are finished.
		done: function () {
			return this.filter(function (todo) {
				return todo.get('done');
			});
		},

		// Filter down the list to only todo items that are still not finished.
		remaining: function () {
			return this.without.apply(this, this.done());
		},

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			if (!this.length) {
				return 1;
			}
			return this.last().get('order') + 1;
		},

		// Todos are sorted by their original insertion order.
		comparator: function (todo) {
			return todo.get('order');
		}

	});

	// Todo Item View
	// --------------
			var allStmts = [];

	// The DOM element for a todo item...
	var TodoView = Parse.View.extend({
		//... is a list tag.
		tagName: "li",

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
			//"click .beacon" : "tincanCreate",
//			"click .url-link": "tincanCreate",
			"click .url-link": function(){this.tincanCreate("one");},
			"click .btn-manual": function(){this.tincanCreate("one");},
			"click .unique": function(){this.tincanCreate("one");},
			"click .autolinks": function(){this.tincanCreate("one");},
			"click .accordion-drop": "accordionDrop",
			"submit form.freeform-form": "freeformSubmit",
		},

		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a Todo and a TodoView in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
			this.dispatcher = dispatcher;
			dispatcher.on('navprofileview:complete', this.completeAll, this);
//			dispatcher.on('managetodosview:tincanCreate', this.tincanCreate("one"), this);
			_.bindAll(this, 'render', 'remove', 'toggleDone', 'tincanCreate', 'checkTinCanStatus', 'checkTinCanStatusArray');
			this.model.bind('change', this.render);

//			this.checkTinCanComplete();
		},

		completeAll: function () {
			this.tincanCreate("many");
		},

		// Re-render the contents of the todo item.
		render: function () {
			var self = this;
			$(this.el).html(this.template(this.model.toJSON()));
			$(this.el).addClass('has-sub');
			$('#main-list li.active').addClass('open').children('ul').show();

			//MK added - converts URLs in strings to actual links using Autolinker.js
//			var autolinker = new Autolinker({
//				newWindow: true,
//				truncate: 50,
//				className: "autolinks"
//			});

//			if (!$(this.el).find('ul').hasClass("bookmarklet")) {
//				var listContent = autolinker.link($(this.el).find('.more-info-text').html());
//				$(this.el).find('.more-info').html(listContent);
//			} else {}

			var parseDone = this.model.get("done");
			var parseType = this.model.get("type");

			if (parseDone === true) {
				$(this.el).addClass("completed");
				$(this.el).find('button').attr('disabled', 'disabled');
			}
			else if (parseDone === false) {
				$(this.el).removeClass("completed");
			}

			function showHTML(element) {
				$(self.el).find(element).removeClass('hidden');
			}

			switch(parseType) {
				case "freeform":
					if (parseDone) {
						showHTML('.user-text-answer');
						showHTML('.user-rating-answer');
					}
					else {
						showHTML('.starRatingBox');
						showHTML('.freeform-form');
					}
					break;
//				case "qr":
//					showHTML('.btn-qr');
//					break;
//				case "manual":
//					showHTML('.btn-manual');
//					break;
//				case "beacon":
//					showHTML('.beacon-data');
//					break;
				case "question":
					if (parseDone) { showHTML('.user-text-answer'); }
					else { showHTML('.freeform-form'); }
					break;
//				case "sensortag":
//					showHTML('.sensortag-buttons');
//					showHTML('.sensortag-data');
//					break;
				case "url":
					$(self.el).find('a').addClass('url-link');
					break;
				case "twitter":
//					var buttonLocation = this.el.getElementsByClassName('more-info-top')[0];
//					var twitterType = this.model.attributes.uniqueID;
//					if (twitterType === "tweet") {
//						twttr.widgets.createShareButton(
//							"http://www.torrancelearning.com/xapi/gnome",
//							buttonLocation,
//							{
//								size: "large",
//								align: "left",
//								via: "xAPIGnome",
//								count: "none",
//								text: "I just completed an item in the @xAPIGnome app",
//								hashtags: "xAPI"
//							}
//						).then( function() {
//								console.log('Tweet button added.');
//							});
//					}
//					else if (twitterType === "follow") {
//						twttr.widgets.createFollowButton(
//							"xAPIGnome",
//							buttonLocation,
//							{
//								showScreenName: "true",
//								size: "large",
//								showCount: false,
//							}
//						).then( function() {
//								console.log('Follow button added.');
//							});
//					}

					break;
				default:
					break;
			}

			var iconClasses = {
				"manual": "fa-check",
				"qr": "fa-qrcode",
				"nfc": "fa-mobile",
				"beacon": "fa-wifi",
				"sensortag": "fa-wifi",
				"iot-button": "fa-hand-o-down",
				"video": "fa-video-camera",
				"url": "fa-link",
				"freeform": "fa-comment",
				"question": "fa-question-circle",
				"course": "fa-desktop",
				"bookmarklet": "fa-bookmark-o",
				"twitter": "fa-twitter",
			};
			for (var key in iconClasses) {
				if (iconClasses.hasOwnProperty(key)) {
					if (this.model.get("type") === key) {
						$(this.el).find('.icon').addClass(iconClasses[key]);
					}
				}
			}

			return this;
		}, // end render function

		accordionDrop: function () {
			var element = $(this.el);
			if (element.hasClass('open')) {
				element.removeClass('open');
				element.find('li').removeClass('open');
				element.find('ul').slideUp(200);
			} else {
				element.addClass('open');
				element.children('ul').slideDown(200);
				element.siblings('li').children('ul').slideUp(200);
				element.siblings('li').removeClass('open');
				element.siblings('li').find('li').removeClass('open');
				element.siblings('li').find('ul').slideUp(200);
			}

//				console.log(element.find("p.more-info-bottom").offset().top);
			$('html, body').animate({
//				scrollTop: 600
				scrollTop: element.find("p.more-info-bottom").offset().top
			}, '1000', 'swing', function() {});
		},

		freeformSubmit: function () {
			var userInputValue = $(this.el).find(".freeform-text").val();
			var userRating = $(this.el).find(".userRating:checked").val();
			this.model.save({
				"definition": userInputValue
			});
			this.model.save({
				"rating": userRating
			});
			this.tincanCreate("one", userInputValue, userRating);
			return false;
		},

		tincanCreate: function (qty, userInputValue, userRating) {
			if (this.model.get("done") === true) {
				console.log("This item is complete.");
				return;
			}

			$(this.el).find('.accordion-drop').addClass('waiting');

			var username = Parse.User.current().attributes.username,
				email = Parse.User.current().attributes.email,
				parseData = this.model.attributes,
				tincanDefName = "";

			if (parseData.userInput === true) {
				tincanDefName = userInputValue;
			} else {
				tincanDefName = parseData.definition;
			}

			var tinCanExtension = null;
			if (userRating) {
				tinCanExtension = {
					"http://id.tincanapi.com/extension/quality-rating": {
						"raw": userRating,
						"min": 1,
						"max": 5
					}
				};
			}
			var tincanStmt = {
				actor: {
					name: username,
					mbox: email
				},
				verb: {
					id: parseData.verbSource + parseData.verb,
					display: {
						"en-US": parseData.display
					}
				},
				target: {
					id: parseData.objIDprefix + parseData.objID,
					definition: {
						name: {
							"en-US": tincanDefName
						},
						description: {
							"en-US": parseData.description
						},
					}
				},
				context: {
					extensions: tinCanExtension
				}

			};

			if (qty === "one") {
				this.sendOneStatement(tincanStmt);
			}
			else if (qty === "many") {
//				this.toggleDone(); // not as accurate as refreshing the view, but quicker
				var listLength = $("#todo-list .has-sub:not('.completed')").length;
//				console.log(listLength);
				allStmts.push(tincanStmt);
//				console.log(allStmts.length);
				if (allStmts.length === listLength) {
					console.log("all full up");
					this.sendManyStatements(allStmts);
				}
			}
		},

		sendOneStatement: function (tincanStmt) {
			tincan.sendStatement(tincanStmt, this.checkTinCanStatus);
		},

		sendManyStatements: function (allStmts) {
//			console.log(allStmts);
			tincan.sendStatements(allStmts, this.checkTinCanStatusArray);
		},

		checkTinCanStatus: function (statusResults, stmt) {
			var sentStatus = statusResults[0].xhr.status,
				sentStatusText = statusResults[0].xhr.statusText;
			if (sentStatus === 0 || sentStatus === 400) {
				//alert("FAIL: sentStatus = " + sentStatus + " " + sentStatusText + " " + statusResults[0].err );
				console.log("FAIL: sentStatus = " + sentStatus + " " + sentStatusText + " " + statusResults[0].err);
			} else {
				console.log("SUCCESS: sentStatus  = " + sentStatus + " " + sentStatusText);
				this.toggleDone();

				var username = stmt.actor.name;
				var verb = stmt.verb.display["en-US"];
				var activity = stmt.target.definition.name["en-US"];
				var value1 = username+" "+verb+" "+activity;
				console.log("IFTTT: "+value1);
//				var username = Parse.User.current().attributes.username;

					$.ajax({
							url: "https://maker.ifttt.com/trigger/wear-notify/with/key/d8lbai9wnRLwZ3dTv4r6ap",
							data: { "value1" : value1}
					})
					.done(function() {
						console.log("IFTTT message sent.");
					});

				dweetio.dweet_for("xAPIGnomeUser", {actor:username, verb:verb, object:activity}, function(err, dweet){
					console.log("Dweeted: "+dweet.content.actor+" "+dweet.content.verb+" "+dweet.content.object); // The content of the dweet
				});
			}
		},

		checkTinCanStatusArray: function(statusResults) {
			this.dispatcher = dispatcher;
			var sentStatus = statusResults[0].xhr.status,
				sentStatusText = statusResults[0].xhr.statusText;
			if (sentStatus === 0 || sentStatus === 400) {
				console.log("FAIL: sentStatus = " + sentStatus + " " + sentStatusText + " " + statusResults[0].err);
			} else {
				console.log("SUCCESS: sentStatus  = " + sentStatus + " " + sentStatusText);
				dispatcher.trigger('todoview:refresh', 'refresh'); // this actually works, but it is slower so it's off right now
				dweetio.dweet_for("xAPIGnomeUser", {completed:"all items complete"}, function(err, dweet){
					console.log("Dweeted: "+dweet.content.completed); // The content of the dweet
				});
			}
		},

		toggleDone: function () {
			this.model.finish();
			if (window.cordova) {
				navigator.notification.vibrate(100);
			}
		},

	}); // end TodoView

	// The Application
	// ---------------

	// The main view that lets a user manage their todo items
	var ManageTodosView = Parse.View.extend({

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template($('#stats-template').html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
//			"click #twitter": "getTwitter",
			"click .btn-qr": "scanQR",
			"click #btn-sync": "refreshData",
			"click .sensortag-connect": "sensortagConnectTrigger",
			"click .sensortag-disconnect": "sensortagDisconnectTrigger",
//			"navprofileview:clear clear": "initialize",
//			"click ul#filters a": "selectFilter"
		},

		el: ".content",

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved to Parse.
		initialize: function () {
			this.dispatcher = dispatcher;
//			$(this.el).find('#btn-sync').removeClass('rotate');

//			dispatcher.on('managetodosview:complete', this.completeAll, this);
//			dispatcher.on("navprofileview:complete", this.completeAll, this);
			_.bindAll(this, 'scanQR', 'initCordovaPlugs', 'initBeacons', 'rangeBeacons', 'initBean', 'onNdef', 'decodePayload', 'refreshData', 'addOne', 'addAll', 'addSome', 'render', 'checkTinCanComplete', 'checkIfAllComplete', 'reloadPage', 'sensortagConnectTrigger');

			// Main todo management template
			this.$el.html(_.template($("#manage-todos-template").html()));
			$(this.el).find('#btn-sync').addClass('rotate');

			dispatcher.on('todoview:refresh', this.refreshData);
			dispatcher.on('todoview:reload', this.reloadPage);
			// Create our collection of Todos
			this.todos = new TodoList();

//			$('#todoapp').perfectScrollbar();

			// Setup the query for the collection to look for todos from the current user
			this.todos.query = new Parse.Query(Todo);
			this.todos.query.equalTo("user", Parse.User.current());
			// Could probably work with the above to have an "admin" version to switch between different users' lists

			var testingTitle = this.todos.query.equalTo("className").className;
			if (testingTitle === "testing") {
				$('.title h1').html(testingTitle);
			} else {
				$('.title h1').html(Parse.User.current().getUsername() + "'s checklist");
			}

			this.todos.bind('add', this.addOne);
			this.todos.bind('reset', this.addAll);
			this.todos.bind('all', this.render);

			// Fetch all the todo items for this user
			this.todos.fetch();

//			state.on("change", this.filter, this);

			tincan.actor = {
				name: Parse.User.current().attributes.username,
				mbox: Parse.User.current().attributes.email
			};

			//		testUser = Parse.User.current().getUsername();

			//console.log(tincan);

			this.checkTinCanComplete();

//			twttr.ready(
//				function (twttr) {
//					// bind events here
//					twttr.events.bind(
//						'tweet',
//						function (event) {
//							console.log(event);
//							console.log(event.data);
//							$("input.twitter[value='tweet']").click();
//						}
//					);
//					twttr.events.bind(
//						'follow',
//						function (event) {
//							console.log(event);
//							$("input.twitter[value='follow']").click();
//						}
//					);
//				}
//			);

			if (window.cordova) {
				document.addEventListener('deviceready', this.initCordovaPlugs, false);
			}
		}, // end initialize

		reloadPage: function () {
			location.reload();
		},

		initCordovaPlugs: function () {
			console.log("initCordovaPlugs started");
			this.initBeacons();
			this.nfcListen();
			this.initBean();
			this.initSensortag();
			//beanapp.connect();
		},

		sensortagConnectTrigger: function() {
			console.log("connect clicked");
//			e.preventDefault();
			dispatcher.trigger("connect");
		},

		sensortagDisconnectTrigger: function() {
			console.log("disconnect clicked");
//			e.preventDefault();
			dispatcher.trigger("connect");
		},

		initSensortag: function () {
//			var self = this;
			evothings.scriptsLoaded(initialiseSensorTag);


			var sensortag;

			function initialiseSensorTag() {
				console.log("initialiseSensorTag");
				// Create SensorTag CC2650 instance.

				sensortag = evothings.tisensortag.createInstance(
					evothings.tisensortag.CC2650_BLUETOOTH_SMART);

				sensortag
					.statusCallback(statusHandler)
					.errorCallback(errorHandler)
					.keypressCallback(keypressHandler)
					.temperatureCallback(temperatureHandler, 1000)
					.humidityCallback(humidityHandler, 1000)
					.barometerCallback(barometerHandler, 1000)
					.accelerometerCallback(accelerometerHandler, 1000)
					.magnetometerCallback(magnetometerHandler, 1000)
					.gyroscopeCallback(gyroscopeHandler, 1000)
					.luxometerCallback(luxometerHandler, 1000);
			}

			function sensorTagConnect() {
				console.log("connect function");
				sensortag.connectToNearestDevice();
			}

			function sensorTagDisconnect() {
				console.log("disconnect function");
				sensortag.disconnectDevice();
				resetSensorDisplayValues();
			}

			dispatcher.on("connect", sensorTagConnect);
			dispatcher.on("disconnect", sensorTagDisconnect);
//			$('.sensortag-connect').on('click', sensorTagConnect);
//			$('.sensortag-disconnect').on('click', sensorTagDisconnect);


			function statusHandler(status) {
				displayValue('StatusData', status);
			}

			function errorHandler(error) {
				console.log('Error: ' + error);

				if (evothings.easyble.error.DISCONNECTED == error) {
					resetSensorDisplayValues();
				} else {
					displayValue('StatusData', 'Error: ' + error);
				}
			}

			function resetSensorDisplayValues() {
				// Clear current values.
				var blank = '[Waiting for value]';
				displayValue('StatusData', 'Press Connect to find a SensorTag');
				displayValue('KeypressData', blank);
				displayValue('TemperatureData', blank);
				displayValue('AccelerometerData', blank);
				displayValue('HumidityData', blank);
				displayValue('MagnetometerData', blank);
				displayValue('BarometerData', blank);
				displayValue('GyroscopeData', blank);
				displayValue('LuxometerData', blank);

				// Reset screen color.
				//	setBackgroundColor('white');
			}

			function keypressHandler(data) {
				// Update the value displayed.
				var string = 'raw: 0x' + bufferToHexStr(data, 0, 1);
				if (data[0] === 1) {
					button1pressComplete();
				}

				displayValue('KeypressData', string);
			}

			var button1pressed = false;

			function button1pressComplete() {
				if (!button1pressed) {
					button1pressed = true;
					console.log("Button 1 pressed");
//					var button1pressItem = $(".unique .iot-button :input[value='sensortag']");
					var button1pressItem = $("input.sensortag").filter(function(){ return this.value=='button1'; });
					console.log(button1pressItem);
					button1pressItem.click();
//					self.dispatcher.trigger('managetodosview:tincanCreate', self);
				}
			}

			function temperatureHandler(data) {
				// Calculate temperature from raw sensor data.
				var values = sensortag.getTemperatureValues(data),
					ac = values.ambientTemperature,
					af = sensortag.celsiusToFahrenheit(ac),
					tc = values.targetTemperature,
					tf = sensortag.celsiusToFahrenheit(tc);

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, 0, 4) + '</span><br/>' +
					(tc >= 0 ? '+' : '') + tc.toFixed(2) + '&deg; C ' +
					'(' + (tf >= 0 ? '+' : '') + tf.toFixed(2) + '&deg; F)' + '<br/>' +
					(ac >= 0 ? '+' : '') + ac.toFixed(2) + '&deg; C ' +
					'(' + (af >= 0 ? '+' : '') + af.toFixed(2) + '&deg; F) [amb]' +
					'<br/>';

				// Update the value displayed.
				displayValue('TemperatureData', string);
			}

			function accelerometerHandler(data) {
				// Calculate the x,y,z accelerometer values from raw data.
				var values = sensortag.getAccelerometerValues(data),
					x = values.x, //mult by 100 to make it easier to see change
					y = values.y,
					z = values.z;

				//var model = sensortag.getDeviceModel()
				//var dataOffset = (model == 2 ? 6 : 0)

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, dataOffset, 6) + '</span><br/>' +
					'x: ' + (x >= 0 ? '+' : '') + x.toFixed(3) + 'G<br/>' +
					'y: ' + (y >= 0 ? '+' : '') + y.toFixed(3) + 'G<br/>' +
					'z: ' + (z >= 0 ? '+' : '') + z.toFixed(3) + 'G<br/>';

				if (x > 1.4 || y > 1.4 || z > 1.4) {
					tagThrownComplete();
				}

				// Update the value displayed.
				displayValue('AccelerometerData', string);
			}

			var tagThrown = false;

			function tagThrownComplete() {
				if (!tagThrown) {
					tagThrown = true;
					console.log("Tag thrown");
					var accelItem = $("input.sensortag").filter(function(){ return this.value=='accelerometer'; });
					accelItem.click();				}
			}

			function humidityHandler(data) {
				// Calculate the humidity values from raw data.
				var values = sensortag.getHumidityValues(data);

				// Calculate the humidity temperature (C and F).
				var tc = values.humidityTemperature;
				var tf = sensortag.celsiusToFahrenheit(tc);

				// Calculate the relative humidity.
				var h = values.relativeHumidity;

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, 0, 4) + '</span><br/>'
					(tc >= 0 ? '+' : '') + tc.toFixed(2) + '&deg; C ' +
					'(' + (tf >= 0 ? '+' : '') + tf.toFixed(2) + '&deg; F)' + '<br/>' +
					(h >= 0 ? '+' : '') + h.toFixed(2) + '% RH' + '<br/>';

				// Update the value displayed.
				displayValue('HumidityData', string);
			}

			function magnetometerHandler(data) {
				// Calculate the magnetometer values from raw sensor data.
				var values = sensortag.getMagnetometerValues(data);
				var x = values.x;
				var y = values.y;
				var z = values.z;

				//var model = sensortag.getDeviceModel()
				//var dataOffset = (model == 2 ? 12 : 0)

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, dataOffset, 6) + '</span><br/>' +
					'x: ' + (x >= 0 ? '+' : '') + x.toFixed(5) + '&micro;T <br/>' +
					'y: ' + (y >= 0 ? '+' : '') + y.toFixed(5) + '&micro;T <br/>' +
					'z: ' + (z >= 0 ? '+' : '') + z.toFixed(5) + '&micro;T <br/>';

				if (x < -240) {
					magnetTouchComplete();
				}

				// Update the value displayed.
				displayValue('MagnetometerData', string);
			}

			var magnetTouched = false;

			function magnetTouchComplete() {
				if (!magnetTouched) {
					magnetTouched = true;
					console.log("Magnet touched");
					var magnetItem = $("input.sensortag").filter(function(){ return this.value=='magnetometer'; });
					magnetItem.click();
				}
			}

			function barometerHandler(data) {
				// Calculate pressure from raw sensor data.
				var values = sensortag.getBarometerValues(data);
				var pressure = values.pressure;

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, 0, 4) + '</span><br/>' +
					'Pressure: ' + pressure.toPrecision(5) + ' mbar<br/>';

				// Update the value displayed.
				displayValue('BarometerData', string);
			}

			function gyroscopeHandler(data) {
				// Calculate the gyroscope values from raw sensor data.
				var values = sensortag.getGyroscopeValues(data);
				var x = values.x;
				var y = values.y;
				var z = values.z;

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, 0, 6) + '</span><br/>' +
					'x: ' + (x >= 0 ? '+' : '') + x.toFixed(5) + '<br/>' +
					'y: ' + (y >= 0 ? '+' : '') + y.toFixed(5) + '<br/>' +
					'z: ' + (z >= 0 ? '+' : '') + z.toFixed(5) + '<br/>';

				// Update the value displayed.
				displayValue('GyroscopeData', string);
			}

			function luxometerHandler(data) {
				var value = sensortag.getLuxometerValue(data);

				// Prepare the information to display.
				var string =
					//'raw: <span style="font-family: monospace;">0x' +
					//	bufferToHexStr(data, 0, 2) + '</span><br/>' +
					'Light level: ' + value.toPrecision(5) + ' lux<br/>';
				if (value > 0.75) {
					boxOpenComplete();
				}

				// Update the value displayed.
				displayValue('LuxometerData', string);
			}

			var boxOpen = false;

			function boxOpenComplete() {
				if (!boxOpen) {
					boxOpen = true;
					console.log("box opened");
					var luxItem = $("input.sensortag").filter(function(){ return this.value=='luxometer'; });
					luxItem.click();
				}
			}

			function displayValue(elementId, value) {
//				document.getElementByClassName(elementId).innerHTML = value;
				var testData = $("."+elementId)[0];
				testData.innerHTML = value;
			}

			/**
			 * Convert byte buffer to hex string.
			 * @param buffer - an Uint8Array
			 * @param offset - byte offset
			 * @param numBytes - number of bytes to read
			 * @return string with hex representation of bytes
			 */
			function bufferToHexStr(buffer, offset, numBytes) {
				var hex = '';
				for (var i = 0; i < numBytes; ++i) {
					hex += byteToHexStr(buffer[offset + i]);
				}
				return hex;
			}

			/**
			 * Convert byte number to hex string.
			 */
			function byteToHexStr(d) {
				if (d < 0) {
					d = 0xFF + d + 1;
				}
				var hex = Number(d).toString(16);
				var padding = 2;
				while (hex.length < padding) {
					hex = '0' + hex;
				}
				return hex;
			}

		},

		initBean: function () {
			var beanapp = {};

			beanapp.UUID_SCRATCHSERVICE = 'a495ff20-c5b1-4b44-b512-1370f02d74de';

			beanapp.getScratchCharacteristicUUID = function (scratchNumber) {
				return ['a495ff21-c5b1-4b44-b512-1370f02d74de',
				'a495ff22-c5b1-4b44-b512-1370f02d74de',
				'a495ff23-c5b1-4b44-b512-1370f02d74de',
				'a495ff24-c5b1-4b44-b512-1370f02d74de',
				'a495ff25-c5b1-4b44-b512-1370f02d74de'][scratchNumber - 1];
			};

			beanapp.deviceIsLightBlueBeanWithBleId = function (device, bleId) {
				return ((device !== null) && (device.name !== null) && (device.name == bleId));
			};

			beanapp.connect = function (user) {
				var BLEId = "LightBlueBean";

				beanapp.showInfo('Trying to connect to "' + BLEId + '"');

				beanapp.disconnect(user);

				function onScanSuccess(device) {
					function onConnectSuccess(device) {
						function onServiceSuccess(device) {
							// Update user interface
							beanapp.showInfo('Connected to ' + BLEId + '');
							//				document.getElementById('BLEButton').innerHTML = 'Disconnect';
							//				document.getElementById('BLEButton').onclick = new Function('beanapp.disconnect()');
							//				document.getElementById('ledControl').style.display = 'block';
							//				document.getElementById('temperatureDisplay').style.display = 'block';

							// Application is now connected
							beanapp.connected = true;
							beanapp.device = device;

							// Fetch current LED values.
//							beanapp.synchronizeLeds();
							$('.beacon-data').append("Bean is ready to be thrown...");
//							$('.beacon-data').append("<br>Bean is ready to be thrown...");

							// Create an interval timer to periocally read temperature.
							beanapp.interval = setInterval(function () {
								beanapp.readTemperature();
								beanapp.readAccel();

							}, 200);
						}

						function onServiceFailure(errorCode) {
							// Show an error message to the user
							beanapp.showInfo('Error reading services: ' + errorCode);
						}

						// Connect to the appropriate BLE service
						device.readServices(
						[beanapp.UUID_SCRATCHSERVICE],
							onServiceSuccess,
							onServiceFailure);
					}

					function onConnectFailure(errorCode) {
						// Show an error message to the user
						beanapp.showInfo('Connect error ' + errorCode);
					}


					// Connect if we have found a LightBlue Bean with the name from input (BLEId)
					var found = beanapp.deviceIsLightBlueBeanWithBleId(device, "LightBlueBean");

					if (found) {
						// Update user interface
						//beanapp.showInfo('Found "' + device.name + '"');
						beanapp.showInfo('Found device: ' + device.name);

						// Stop scanning
						evothings.easyble.stopScan();

						// Connect to our device
						beanapp.showInfo('Identifying services for communication');
						device.connect(onConnectSuccess, onConnectFailure);
					}
				}

				function onScanFailure(errorCode) {
					// Show an error message to the user
					beanapp.showInfo('Scan error: ' + errorCode);
					evothings.easyble.stopScan();
				}

				// Update the user interface
				beanapp.showInfo('Scanning for Bean...');

				// Start scanning for devices
				evothings.easyble.startScan(onScanSuccess, onScanFailure);
			};

			beanapp.disconnect = function (user) {
				// If timer configured, clear.
				if (beanapp.interval) {
					clearInterval(beanapp.interval);
				}

				beanapp.connected = false;
				beanapp.device = null;

				// Hide user inteface
				//document.getElementById('ledControl').style.display = 'none';
				//	document.getElementById('temperatureDisplay').style.display = 'none';

				// Stop any ongoing scan and close devices.
				evothings.easyble.stopScan();
				evothings.easyble.closeConnectedDevices();

				// Update user interface
				beanapp.showInfo('Not currently connected');
				//	document.getElementById('BLEButton').innerHTML = 'Connect';
				//	document.getElementById('BLEButton').onclick = new Function('beanapp.connect()');
			};

			beanapp.readTemperature = function () {
				function onDataReadSuccess(data) {
					var temperatureData = new Uint8Array(data);
					var temperature = temperatureData[0];
					temperature = temperature * 9 / 5 + 32;
					temperature = Math.round(temperature);
					//console.log('Temperature read: ' + temperature + ' F');
					//document.getElementById('temperature').innerHTML = temperature;
					beanapp.showInfo("Temp is " + temperature + " F");
				}

				function onDataReadFailure(errorCode) {
					console.log('Failed to read temperature with error: ' + errorCode);
					beanapp.disconnect();
				}

				beanapp.readDataFromScratch(2, onDataReadSuccess, onDataReadFailure);
			};

			beanapp.readAccel = function () {
				console.log("Reading acceleration");

				function onDataReadSuccess(data) {
					var accelData = new Uint8Array(data);
					var accel = accelData[0];
					if (accel === 1) {
						markComplete();
						beanapp.disconnect();
					}
				}

				function onDataReadFailure(errorCode) {
					console.log('Failed to read accel with error: ' + errorCode);
					beanapp.disconnect();
					$('.beacon-data').html("<button id='rebootBean'>REBOOT<button>");
					$('#rebootBean').on('click', beanapp.connect());
				}

				beanapp.readDataFromScratch(3, onDataReadSuccess, onDataReadFailure);
			};

			function markComplete() {
				beanapp.showInfo("Thrown!");
//				beanapp.disconnect();
//						evothings.easyble.stopScan();
//						evothings.easyble.closeConnectedDevices();
				console.log("Bean disconnected");
				$('.beacon-data').html("Bean disconnected");
				var uniqueID = "happy", //eventually add this to Bean code to pull from
				throwItems = this.$(".unique"),
				throwItemsText = null;
				for (var i = 0; i < throwItems.length; i++) {
					throwItemsText = throwItems[i].value;
					if (uniqueID === throwItemsText) {
						console.log("throw completed");
						throwItems[i].click();
						return;
					}
				}
				//console.log('Accel read: ' + accel + ' means it has moved!');
			}


					beanapp.synchronizeLeds = function() {
						function onDataReadSuccess(data) {
							var ledData = new Uint8Array(data);

							//document.getElementById('redLed').value = ledData[0];
					//		document.getElementById('greenLed').value = ledData[1];
					//		document.getElementById('blueLed').value = ledData[2];

							console.log('Led synchronized.');
						}

						function onDataReadFailure(errorCode) {
							console.log('Failed to synchronize leds with error: ' + errorCode);
							beanapp.disconnect();
						}

						beanapp.readDataFromScratch(1, onDataReadSuccess, onDataReadFailure);
					};

					beanapp.sendLedUpdate = function() {
						if (beanapp.connected) {
							// Fetch LED values from UI
					//		redLed = document.getElementById('redLed').value;
					//		greenLed = document.getElementById('greenLed').value;
					//		blueLed = document.getElementById('blueLed').value;

							redLed = 0;
							greenLed = 0;
							blueLed = 0;

							// Print out fetched LED values
			//				console.log('redLed: ' + redLed + ', greenLed: ' + greenLed + ', blueLed: ' + blueLed);

							// Create packet to send
							var data = new Uint8Array([redLed, greenLed, blueLed]);

							// Callbacks
							function onDataWriteSuccess()
							{
								console.log('Succeded to write data.');
							}

							function onDataWriteFailure(errorCode)
							{
								console.log('Failed to write data with error: ' + errorCode);
								beanapp.disconnect();
							};

							beanapp.writeDataToScratch(1, data, onDataWriteSuccess, onDataWriteFailure);
						}
						else
						{
					//		redLed = document.getElementById('redLed').value = 0;
					//		greenLed = document.getElementById('greenLed').value = 0;
					//		blueLed = document.getElementById('blueLed').value = 0;
						}
					};

			beanapp.writeDataToScratch = function (scratchNumber, data, succesCallback, failCallback) {
				if (beanapp.connected) {
					console.log('Trying to write data to scratch ' + scratchNumber);
					beanapp.device.writeCharacteristic(
						beanapp.getScratchCharacteristicUUID(scratchNumber),
						data,
						succesCallback,
						failCallback);
				} else {
					console.log('Not connected to device, cant write data to scratch.');
				}
			};

			beanapp.readDataFromScratch = function (scratchNumber, successCallback, failCallback) {
				if (beanapp.connected) {
					//console.log('Trying to read data from scratch ' + scratchNumber);
					beanapp.device.readCharacteristic(
						beanapp.getScratchCharacteristicUUID(scratchNumber),
						successCallback,
						failCallback);
				} else {
					console.log('Not connected to device, cant read data from scratch.');
				}
			};

			beanapp.showInfo = function (info) {
				console.log(info);
//				document.getElementById('BLEStatus').innerHTML = info;
				$('.beacon-data').html(info);
			};

			beanapp.connect();
		},

		initBeacons: function () {
			console.log("initBeacons started");

			//console.log($(this.el).find(".beacon").length);
			var beaconItem = $(this.el).find('.has-sub');
			//		if (beaconItem.length > 0) {
			//			if (beaconItem.parent().hasClass('completed')) {
			//		console.log("beacons: " + beaconItem.length)
			//		console.log("beacon parent complete: " + beaconItem.parent().hasClass('completed').length)
			if (beaconItem.length === beaconItem.parent().hasClass('completed').length) {
				console.log("all beacons complete");
				return;
			} else {
				this.rangeBeacons();
			}
			//
			//		if ($(this.el).find(".beacon").length) {
			//			alert(this.$(".beacon").parent());
			//			if (this.$(".beacon").parent().hasClass('completed')) {
			//				alert("this beacon is complete");
			//			}
			//		}
		},

		rangeBeacons: function () {
			console.log("rangeBeacons started");
			var regions = [
			// Estimote Beacon factory UUID.
				{
					uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
				},
			// Gnomes:
				{
					uuid: '206a6e55-9ed9-4216-8559-2027ce3447c4'
				},
		];

			// Dictionary of beacons.
			var beacons = {};
			window.locationManager = cordova.plugins.locationManager;
			var delegate = new locationManager.Delegate();

			delegate.didRangeBeaconsInRegion = function (pluginResult) {
				//alert("Beacons found");
				for (var i in pluginResult.beacons) { // Insert beacon into table of found beacons.
					var beacon = pluginResult.beacons[i];
					beacon.timeStamp = Date.now();
					var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
					beacons[key] = beacon;
					if (beacon.minor === "1") {
						console.log(beacon.rssi, beacon.proximity);
						//if (beacon.proximity === "ProximityImmediate") {
						if (beacon.rssi >= -70) {
							$('.beacon-data').html("Beacon found!");
							//$('.beacon-data').addClass('hidden');
							beacon1Action(beacon);
						}
						if (beacon.proximity === "ProximityNear") {
							$('.beacon-data').html("Beacon is near...");
						}
						if (beacon.minor === "1" && beacon.proximity === "ProximityFar") {
							$('.beacon-data').html("Beacon is in range, but far away.");
						}
					}
				}
			};

			var beacon1Activated = 0;

			function beacon1Action(beacon) {
				beacon1Activated++;
				//alert("Beacon " + beacon.minor + " found");
				//console.log($('.beacon').html());
				var uniqueID = beacon.minor,
					beaconItems = this.$(".unique"),
					beaconItemText = null;
				for (i = 0; i < beaconItems.length; i++) {
					beaconItemText = beaconItems[i].value;
					if (uniqueID === beaconItemText) {
						beaconItems[i].click();
						return;
					}
				}
			}

			locationManager.setDelegate(delegate);
			locationManager.requestAlwaysAuthorization(); // in case this ever goes to iOS 8

			for (var i in regions) {
				var beaconRegion = new locationManager.BeaconRegion(
					i + 1,
					regions[i].uuid);

				// Start ranging.
				locationManager.startRangingBeaconsInRegion(beaconRegion)
					.fail(console.error)
					.done();
			}
			if (this.$(".beacon").length > 0) {
				if (this.$(".beacon").parent().hasClass('completed')) {
					console.log("this beacon is complete");
				}
			}
		},

		nfcListen: function () {
			nfc.addNdefListener(
				this.onNdef,
				function () {
					console.log("Listening for NDEF tags.");
				},
				failure
			);

			function failure(reason) {
				navigator.notification.alert(reason, function () {}, "There was a problem");
			}
		},

		onNdef: function (nfcEvent) {
			var uniqueID = this.decodePayload(nfcEvent.tag.ndefMessage[0]),
				nfcItems = this.$(".unique"),
				nfcItemText = null;
			for (var i = 0; i < nfcItems.length; i++) {
				nfcItemText = nfcItems[i].value;
				if (uniqueID === nfcItemText) {
					nfcItems[i].click();
					return;
				}
			}

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
					uri = nfc.bytesToString(record.payload);
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

		scanQR: function () {
			if (!window.cordova) {
				alert("Sorry, this requires the mobile app to access the QR reader.");
			} else {
				cordova.plugins.barcodeScanner.scan(
					function (result) {
						var scanQRText = result.text,
							qrItems = this.$(".unique");
						for (var i = 0; i < qrItems.length; i++) {
							var qrItemText = qrItems[i].value;
							if (scanQRText === qrItemText) {
								qrItems[i].click();
								return;
							}
						}
					},
					function (error) {
						alert("Scanning failed: " + error);
					}
				);
			}
		},

		refreshData: function () {
			this.initialize();
			$(this.el).find('#btn-sync').addClass('rotate');
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function () {
			this.delegateEvents();
//			$('#container').perfectScrollbar('update');
			$(this.el).find('#btn-sync').removeClass('rotate');
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (todo) {
			var view = new TodoView({
				model: todo
			});
			this.$("#todo-list").append(view.render().el);
		},

		// Add all items in the Todos collection at once.
		addAll: function () { //(collection, filter)
			this.$("#todo-list").html("");
			this.todos.each(this.addOne);
		},

		// Only adds some todos, based on a filtering function that is passed in
		addSome: function (filter) {
			var self = this;
			this.$("#todo-list").html("");
			this.todos.chain().filter(filter).each(function (item) {
				self.addOne(item);
			});
		},

		checkTinCanComplete: function () {
			var thisView = this;
			Parse.User.current().fetch().then(function (user) {
				var userName = user.get('name');
				var userEmail = user.get('email');
				userEmail = "mailto:" + userEmail;
				tincan.getStatements({
					params: { // 'params' is passed through to TinCan.LRS.queryStatements
						agent: new TinCan.Agent({name:userName, mbox: userEmail})
					},
					callback: function (err, tinCanQuery) {
						if (err !== null) { // 'err' will be null on success
							console.log("Status = " + err); // handle error
							return;
						}
						if (tinCanQuery.statements.length > 0) {
							var stmtArray = [];
							var listArray = [];
							$.each(tinCanQuery.statements, function(i){
								var stmtActivity = tinCanQuery.statements[i].target.id;
								stmtArray.push(stmtActivity);
							});

//							var count=0;
							thisView.todos.each(function(item){
//								if (item.attributes.done) {count++;}
								var listActivity = item.attributes.objIDprefix + item.attributes.objID;
								listArray.push(listActivity);
								var exists = stmtArray.indexOf(listActivity);
								if (exists >= 0) {
									console.log('exists:', listActivity);
									if (item.attributes.done !== true) {
										console.log("auto-mark complete");
										item.finish();
									}
								}
								else {
									item.save({
										"done": false
									});
								}
							});

							var remaining = _.difference(listArray, stmtArray);
							console.log("activities to complete: ", remaining);
							if (remaining.length === 0) {
								console.log("all items complete");
							}

						} else if (tinCanQuery.statements.length === 0) {
								thisView.todos.each(function(item) {
									item.save({
										"done": false
									});
								});
								console.log("no completed items in LRS");
						}

						thisView.checkIfAllComplete();

					}//end callback
				}); //end tincan get
			}); // end fetch Parse user
		}, //end checktincancomplete

		checkIfAllComplete: function () {
			var count=0;
			this.todos.each(function(item){
				if (item.attributes.done) {count++;}
			});
//			console.log('list length:', this.todos.length);
//			console.log('done count:', count);
			if (this.todos.length === count) {
				var userName = Parse.User.current().getUsername();
				var userEmail = Parse.User.current().getEmail();
				userEmail = "mailto:" + userEmail;

//				tincan.getStatements({
//					params: { // 'params' is passed through to TinCan.LRS.queryStatements
//						agent: new TinCan.Agent({name:userName, mbox: userEmail}),
//						verb: {id: "http://adlnet.gov/expapi/verbs/completed"},
//						activity: {id: "http://www.gnomeland.com/checklist/new-hire"}
//					},
//					callback: function (err, tinCanQuery) {
//						if (err !== null) { // 'err' will be null on success
//							console.log("Status = " + err); // handle error
//							return;
//						}
//						if (tinCanQuery.statements.length > 0) {
//							bootbox.alert("The checklist is complete!", function(){
//								bootbox.hideAll();
//							});
//						}
//						else {
//							console.log("send complete stmt here....");
//							$.ajax({
//									url: "https://maker.ifttt.com/trigger/wemo-activate/with/key/d8lbai9wnRLwZ3dTv4r6ap",
//									data: { "value1" : ""}
//							})
//							.done(function() {
//								console.log("IFTTT message sent.");
//							});							}
//					}//end callback
//				}); //end tincan get
			}
		}

	});//end ManageTodosView

	var NavProfileView = Parse.View.extend({
		events: {
			"click .my-checklists": "myChecklists",
			"click .about": "about",
			"click .clear-all": "clearAll",
			"click .complete-all": "completeAll",
			"click .logout": "logOut",
		},

		el: ".navProfile",

		initialize: function () {
			_.bindAll(this,'myChecklists', 'about', 'clearAll', 'completeAll', 'logOut');
			this.render();
		},

		myChecklists: function () {
			bootbox.alert('Coming Soon?', function(){bootbox.hideAll();});
		},

		about: function () {
			bootbox.alert('xAPI-enabled checklist, created by the @xAPIGnome group for the <strong>ADL xAPI Design Cohort 2015</strong>.', function(){bootbox.hideAll();});
		},

		clearAll: function () {
			var self = this;
			self.dispatcher = dispatcher;
			bootbox.confirm('This will clear all statements in the LRS.<br><strong>Are you sure?</strong>', function(result) {
				if (result === true) {
				bootbox.hideAll();
				$.ajax({
							headers: {"Authorization": tincan.recordStores[0].auth},
							url: "https://cloud.scorm.com/tc/58WJPIFQVJ/sandbox/extended?action=clear_sandbox",
//							async: false
					})
					.done(function() {
						snapper.close();
						console.log("LRS sandbox cleared");
//						self.dispatcher.trigger("navprofileview:clear","clear");
//						new ManageTodosView();
						var username = Parse.User.current().attributes.username;
						dweetio.dweet_for("xAPIGnomeUser", {actor:username, verb:"cleared", object:"the LRS"}, function(err, dweet){
							console.log("Dweeted: "+dweet.content.actor+" "+dweet.content.verb+" "+dweet.content.object); // The content of the dweet
						});

					});
				}
			});
		},

		completeAll: function () {
			var self = this;
			self.dispatcher = dispatcher;
			bootbox.confirm('This will complete all list items.<br><strong>Are you sure?</strong>', function(result) {
				if (result === true) {
					bootbox.hideAll();
					snapper.close();
					self.dispatcher.trigger('navprofileview:complete', 'complete');
				}
			});
		},

		logOut: function () {
			snapper.close();
			Parse.User.logOut();
			new LogInView();
			this.undelegateEvents();
			delete this;
		},

		render: function () {
			this.$el.html(_.template($("#nav-template").html()));
		}
	});


	var LogInView = Parse.View.extend({
		events: {
			"submit form.login-form": "logIn",
			"submit form.signup-form": "signUp"
		},

		el: ".content",

		initialize: function () {
			_.bindAll(this, "logIn", "signUp", "addChecklist");
			this.render();
		},

		logIn: function () {
			var self = this;
			var username = this.$("#login-username").val();
			var password = this.$("#login-password").val();

			Parse.User.logIn(username, password, {
				success: function () { //(user)

					new ManageTodosView();
					new NavProfileView();
					snapper.enable();
					location.reload(); // added to refresh with user model name
					self.undelegateEvents();
					delete self;
				},

				error: function () { //(user, error)
					self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
					self.$(".login-form button").removeAttr("disabled");
				}
			});

			this.$(".login-form button").attr("disabled", "disabled");

			return false;
		},

		signUp: function () {
			var self = this;
			var username = this.$("#signup-username").val();
			var email = this.$("#signup-email").val(); // MK added
			var password = this.$("#signup-password").val();

			Parse.User.signUp(username, password, {
				email: email
			}, {
				success: function () {
					self.addChecklist();
					self.undelegateEvents();
					delete self;
				},

				error: function (user, error) {
					self.$(".signup-form .error").html(_.escape(error.message)).show();
					self.$(".signup-form button").removeAttr("disabled");
				}
			});

			this.$(".signup-form button").attr("disabled", "disabled");

			return false;
		},

		addChecklist: function () {
			var self = this;
			self.dispatcher = dispatcher;
			// get the class you want to copy
			var query = new Parse.Query("MASTER");
			query.find().then(function (results) {
				// creates new Parse class (unless it exists, then it will append)
				var copyMaster = Parse.Object.extend(Parse.User.current().getUsername());

				_.each(results, function (existingList) {
					var newUser = new copyMaster(); //creates new Parse row

					newUser.set("user", Parse.User.current());
					newUser.set("name", Parse.User.current().getUsername());
					newUser.set("email", Parse.User.current().getEmail());

					var listItems = ["order", "done", "verbSource", "verb", "display", "objIDprefix", "userInput", "objID", "definition", "description", "content", "moreInfo", "instruction", "type", "uniqueID", "rating"];

					listItems.forEach(copyListItems);

					function copyListItems(item, index, array) {
						newUser.set(item, existingList.get(item));
					}

					return newUser.save();

				});

			}).then(function () { //(status)

				console.log("successfully copied list");
				new NavProfileView();
				new ManageTodosView();
				snapper.enable();
//				self.dispatcher.trigger('todoview:reload', 'reload');

//			location.reload();
			});
		},

		render: function () {
			this.$el.html(_.template($("#login-template").html()));
			this.delegateEvents();
			snapper.disable();
		}
	});

	// The main view for the app
	var AppView = Parse.View.extend({
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: $("#todoapp"),

		events: {
			"click #btn-menu": "menu",
		},

		initialize: function () {
			this.render();
			var self = this;

			dweetio.listen_for("xAPIGnomeUser", function(dweet){
				if (dweet.content.actor === Parse.User.current().attributes.username) {
					console.log("Dweet received for "+dweet.content.actor);
					self.render();
				}
			});
		},

		menu: function () {
			if (snapper.state().state == "left") {
				snapper.close();
			} else {
				snapper.open('left');
			}
		},

		render: function () {
			if (Parse.User.current()) {
				//currentUser = Parse.User.current().attributes.username;
				new ManageTodosView();
				new NavProfileView();
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

		initialize: function () {},//(options)

		all: function () {
			state.set({
				filter: "all"
			});
		},

		active: function () {
			state.set({
				filter: "active"
			});
		},

		completed: function () {
			state.set({
				filter: "completed"
			});
		}
	});

	var state = new AppState();

	var snapper = new Snap({
		element: document.getElementById('todoapp'),
		disable: 'right',
		hyperextensible: false,
		easing: 'ease',
		//touchToDrag: true,
	});

	new AppRouter();
	new AppView();
	Parse.history.start();

});
