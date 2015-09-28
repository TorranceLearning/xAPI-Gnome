
document.addEventListener('deviceready', function() { beanapp.initialize() }, false);

var beanapp = {};

beanapp.UUID_SCRATCHSERVICE = 'a495ff20-c5b1-4b44-b512-1370f02d74de';

beanapp.getScratchCharacteristicUUID = function(scratchNumber)
{
	return ['a495ff21-c5b1-4b44-b512-1370f02d74de',
		'a495ff22-c5b1-4b44-b512-1370f02d74de',
		'a495ff23-c5b1-4b44-b512-1370f02d74de',
		'a495ff24-c5b1-4b44-b512-1370f02d74de',
		'a495ff25-c5b1-4b44-b512-1370f02d74de'][scratchNumber - 1];
};

beanapp.initialize = function()
{
	beanapp.connected = false;
};

beanapp.deviceIsLightBlueBeanWithBleId = function(device, bleId)
{
	return ((device != null) && (device.name != null) && (device.name == bleId));
};

beanapp.connect = function(user)
{
	var BLEId = "LightBlueBean";

	beanapp.showInfo('Trying to connect to "' + BLEId + '"');

	beanapp.disconnect(user);

	function onScanSuccess(device)
	{
		function onConnectSuccess(device)
		{
			function onServiceSuccess(device)
			{
				// Update user interface
				beanapp.showInfo('Connected to <i>' + BLEId + '</i>');
//				document.getElementById('BLEButton').innerHTML = 'Disconnect';
//				document.getElementById('BLEButton').onclick = new Function('beanapp.disconnect()');
//				document.getElementById('ledControl').style.display = 'block';
//				document.getElementById('temperatureDisplay').style.display = 'block';

				// Application is now connected
				beanapp.connected = true;
				beanapp.device = device;

				// Fetch current LED values.
				beanapp.synchronizeLeds();

				// Create an interval timer to periocally read temperature.
				beanapp.interval = setInterval(function() { 
					beanapp.readTemperature(); 
					beanapp.readAccel();
					}, 200);
			}

			function onServiceFailure(errorCode)
			{
				// Show an error message to the user
				beanapp.showInfo('Error reading services: ' + errorCode);
			}

			// Connect to the appropriate BLE service
			device.readServices(
				[beanapp.UUID_SCRATCHSERVICE],
				onServiceSuccess,
				onServiceFailure);
		};

		function onConnectFailure(errorCode)
		{
			// Show an error message to the user
			beanapp.showInfo('Error ' + errorCode);
		}

		console.log('Found device: ' + device.name);

		// Connect if we have found a LightBlue Bean with the name from input (BLEId)
		var found= beanapp.deviceIsLightBlueBeanWithBleId(
			device,
			"LightBlueBean");
		if (found)
		{
			// Update user interface
			beanapp.showInfo('Found "' + device.name + '"');

			// Stop scanning
			evothings.easyble.stopScan();

			// Connect to our device
			beanapp.showInfo('Identifying service for communication');
			device.connect(onConnectSuccess, onConnectFailure);
		}
	}

	function onScanFailure(errorCode)
	{
		// Show an error message to the user
		beanapp.showInfo('Error: ' + errorCode);
		evothings.easyble.stopScan();
	}

	// Update the user interface
	beanapp.showInfo('Scanning...');

	// Start scanning for devices
	evothings.easyble.startScan(onScanSuccess, onScanFailure);
};

beanapp.disconnect = function(user)
{
	// If timer configured, clear.
	if (beanapp.interval)
	{
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
	beanapp.showInfo('Not connected');
//	document.getElementById('BLEButton').innerHTML = 'Connect';
//	document.getElementById('BLEButton').onclick = new Function('beanapp.connect()');
};

beanapp.readTemperature = function()
{
	function onDataReadSuccess(data)
	{
		var temperatureData = new Uint8Array(data);
		var temperature = temperatureData[0];
		temperature = temperature * 9/5+32;
		temperature = Math.round(temperature);
		//console.log('Temperature read: ' + temperature + ' F');
		//document.getElementById('temperature').innerHTML = temperature;
	}

	function onDataReadFailure(errorCode)
	{
		console.log('Failed to read temperature with error: ' + errorCode);
		beanapp.disconnect();
	}

	beanapp.readDataFromScratch(2, onDataReadSuccess, onDataReadFailure);
};

beanapp.readAccel = function()
{
	function onDataReadSuccess(data)
	{
		var accelData = new Uint8Array(data);
		var accel = accelData[0];
		if (accel ===1) {
			//alert("Thrown");
			//console.log('Accel read: ' + accel + ' means it has moved!');
		}
		
		
//		var temperatureData = new Uint8Array(data);
//		var temperature = temperatureData[0];
//		temperature = temperature * 9/5+32;
//		temperature = Math.round(temperature);
//		console.log('Temperature read: ' + temperature + ' F');
//		document.getElementById('temperature').innerHTML = temperature;
	}

	function onDataReadFailure(errorCode)
	{
		console.log('Failed to read accel with error: ' + errorCode);
		beanapp.disconnect();
	}

	beanapp.readDataFromScratch(3, onDataReadSuccess, onDataReadFailure);
};

beanapp.synchronizeLeds = function()
{
	function onDataReadSuccess(data)
	{
		var ledData = new Uint8Array(data);

		//document.getElementById('redLed').value = ledData[0];
//		document.getElementById('greenLed').value = ledData[1];
//		document.getElementById('blueLed').value = ledData[2];

		console.log('Led synchronized.');
	}

	function onDataReadFailure(errorCode)
	{
		console.log('Failed to synchronize leds with error: ' + errorCode);
		beanapp.disconnect();
	}

	beanapp.readDataFromScratch(1, onDataReadSuccess, onDataReadFailure);
};

beanapp.sendLedUpdate = function()
{
	if (beanapp.connected)
	{
		// Fetch LED values from UI
//		redLed = document.getElementById('redLed').value;
//		greenLed = document.getElementById('greenLed').value;
//		blueLed = document.getElementById('blueLed').value;

		// Print out fetched LED values
		console.log('redLed: ' + redLed + ', greenLed: ' + greenLed + ', blueLed: ' + blueLed);

		// Create packet to send
		data = new Uint8Array([redLed, greenLed, blueLed]);

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

beanapp.writeDataToScratch = function(scratchNumber, data, succesCallback, failCallback)
{
	if (beanapp.connected)
	{
		console.log('Trying to write data to scratch ' + scratchNumber);
		beanapp.device.writeCharacteristic(
			beanapp.getScratchCharacteristicUUID(scratchNumber),
			data,
			succesCallback,
			failCallback);
	}
	else
	{
		console.log('Not connected to device, cant write data to scratch.');
	}
};

beanapp.readDataFromScratch = function(scratchNumber, successCallback, failCallback)
{
	if (beanapp.connected)
	{
		//console.log('Trying to read data from scratch ' + scratchNumber);
		beanapp.device.readCharacteristic(
			beanapp.getScratchCharacteristicUUID(scratchNumber),
			successCallback,
			failCallback);
	}
	else
	{
		console.log('Not connected to device, cant read data from scratch.');
	}
};

beanapp.showInfo = function(info)
{
	console.log(info);
	//document.getElementById('BLEStatus').innerHTML = info;
};
