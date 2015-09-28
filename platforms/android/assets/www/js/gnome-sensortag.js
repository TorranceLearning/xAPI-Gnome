/*global $, document, evothings*/

var sensortag;

function initialiseSensorTag() {
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
	sensortag.connectToNearestDevice();
}

function sensorTagDisconnect() {
	sensortag.disconnectDevice();
	resetSensorDisplayValues();
}

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
		alert("Button 1 pressed");
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
	x = values.x,//mult by 100 to make it easier to see change
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
	alert("Tag thrown");
}
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
		alert("Magnet touched");
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
		alert("box opened");
	}
}

function displayValue(elementId, value) {
//var testData = $('.'+elementId+'')[0].innerHTML;
//console.log("Jquery: "+testData);
//	$('.'+elementId+'')[0].innerHTML = value;
	document.getElementsByClassName(elementId)[0].innerHTML = value;

console.log(document.getElementsByClassName(elementId)[0].innerHTML);
//	console.log(elementId+': '+value);
//	document.getElementById(elementId).innerHTML = value;
//	console.log(elementId+': '+value);

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
//
//document.addEventListener(
//	'deviceready',
//	function () {
//		evothings.scriptsLoaded(initialiseSensorTag);
//	},
//	false);
