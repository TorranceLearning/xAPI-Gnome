// JavaScript code for the BLE Scan example app.

// Application object.
var app = {};

// Device list.
app.devices = {};

// UI methods.
app.ui = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

app.initialize = function()
{
	document.addEventListener('deviceready', this.onDeviceReady, false);
};

app.onDeviceReady = function()
{
	console.log("ble device ready ");
	// Not used.
	// Here you can update the UI to say that
	// the device (the phone/tablet) is ready
	// to use BLE and other Cordova functions.
};

// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app.startScan = function(callbackFun)
{
	console.log("start scan");
	app.stopScan();

	evothings.ble.startScan(
		function(device)
		{
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			if (device.rssi <= 0)
			{
				callbackFun(device, null);
			}
		},
		function(errorCode)
		{
			// Report error.
			callbackFun(null, errorCode);
		}
	);
};

// Stop scanning for devices.
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Called when Start Scan button is selected.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Scanning...');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 500);
};

// Called when Stop Scan button is selected.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Scan Paused');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

// Called when a device is found.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		console.log(device.scanRecord);
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();

		// Insert the device into table of found devices.
		app.devices[device.address] = device;
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(app.devices, function(key, device)
	{
		// Only show devices that are updated during the last 10 seconds.
		if (device.timeStamp + 10000 > timeNow)
		{
			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 1; // Used when RSSI is zero or greater.
			if (device.rssi < -100) { rssiWidth = 100; }
			else if (device.rssi < 0) { rssiWidth = 100 + device.rssi; }

			var beaconName = "Anonymous";
			// trim this to certain characters
			if (device.scanRecord === "EQetdwDGoACZsuIRTCSTSgyWDP+MAPCvuEoG0JsuHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") {
				beaconName = "Finbert";	
			}
			else if (device.scanRecord === "EQetdwDGoACZsuIRTCSOSgyWDP+MAIXEy3kCLTCh6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") {
				beaconName = "Finn";	
			}

			// Create tag for device data.
			var element = $(
				'<li>'
				+	'<strong>' + beaconName + '</strong><br />'
				// Do not show address on iOS since it can be confused
				// with an iBeacon UUID.
				+	(evothings.os.isIOS() ? '' : device.address + '<br />')
				+	device.rssi + '<br />'
				+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				+ 		rssiWidth + '%;"></div>'
				+ '</li>'
			);

			$('#found-devices').html(element);
		}
	});
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

//app.initialize();
