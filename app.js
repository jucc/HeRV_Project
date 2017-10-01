// JavaScript code for the BLE Scan example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

function main()
{
  $(function()
  {
    // When document has loaded we attach FastClick to
    // eliminate the 300 ms delay on click events.
    // FastClick.attach(document.body)

    // Event listener for Back button.
    $('.app-back').on('click', function() { history.back() })
    $('.app-game-start').on('click', startGame)
  })

  // Event handler called when Cordova plugins have loaded.
  document.addEventListener(
    'deviceready',
    onDeviceReady,
    false)
}

function onDeviceReady()
{
  // Un-gray buttons.
  $('button.app-start-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')

  // Attach event listeners.
  $('.app-start-scan').on('click', startScan)
  $('.app-stop-scan').on('click', stopScan)
  $('.app-game').on('click', function(){location.href = 'hervgame.html'})
}

function startScan()
{
  // Change buttons.
  $('button.app-start-scan')
    .removeClass('mdl-color--green-A700')
    .addClass('mdl-button--disabled')
  $('button.app-stop-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--deep-orange-900')
  $('button.app-game')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--blue-500')

  evothings.easyble.stopScan();

  evothings.easyble.reportDeviceOnce(true);

  // Start scanning. Two callback functions are specified.
  evothings.easyble.startScan(
    function(device)
    {
      if ((device.name).toLowerCase().indexOf('polar h7') >= 0)
      {
        sensorFound(device);
      }

    },
    function(errorCode)
    {
      putOnScreen('Procedure error: ' + errorCode)
    }
  );
}

function sensorFound(device){

  device.connect(
  function(device)
  {
    putOnScreen('Conneted to ' + device.name);

    device.readServices(
      null,
      function(device)
      {
        device.enableNotification(
          '00002a37-0000-1000-8000-00805f9b34fb',
          function(data)
          {
            // Formats the data from device.
            var hrm = parseHeartRate(data);

            // Shows Heart Rate Mesurement.
            updateHeartRate(hrm.heartRate);

            // Transforme the object to a string.
            hrm = JSON.stringify(hrm.rrIntervals);

            // Create a vector with one or two mesurements.
            hrm = hrm.replace('[','');
            hrm = hrm.replace(']','');
            hrm = hrm.split(',');

            // Shows RR Intervals
            for(var i = 0; i < hrm.length; ++i)
            {
              updateRRInterval(hrm[i]);
            }

          },
          function(errorCode)
          {
            putOnScreen('Error ' + errorCode);
          }
        );
      },
      function(errorCode)
      {
        putOnScreen('Error ' + errorCode);
      });
  },
  function(errorCode)
  {
    putOnScreen('Error ' + errorCode);
  });
}

function stopScan()
{
  // Stop ble scan.
  evothings.easyble.stopScan();
  evothings.easyble.closeConnectedDevices();
  putOnScreen('Device disconnected.');

  // Change buttons.
  $('button.app-start-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')
  $('button.app-stop-scan')
    .removeClass('mdl-color--deep-orange-900')
    .addClass('mdl-button--disabled')
  $('button.app-game')
    .removeClass('mdl-color--deep-orange-900')
    .addClass('mdl-button--disabled')
}

function showMessage(message)
{
  document.querySelector('.mdl-snackbar').MaterialSnackbar.showSnackbar(
  {
    message: message
  });
}

function putOnScreen(message)
{
  // Create element.
  var element = $(
    '<div class="mdl-card__supporting-text">'
    +    message
    +  '</div>')

  // Add element.
  $('.app-cards').html(element);
}

function updateHeartRate(data)
{
  $('#hrm').html(data);
}
function updateRRInterval(data)
{
  $('#statusText').html(data);
}


// Function to parse the Heart Rate Data
// Extracted from: https://github.com/WebBluetoothCG/demos/tree/gh-pages/heart-rate-sensor
function parseHeartRate(value) {
      value = value.buffer ? value : new DataView(value);
      let flags = value.getUint8(0);
      let rate16Bits = flags & 0x1;
      let result = {};
      let index = 1;
      if (rate16Bits) {
        result.heartRate = value.getUint16(index, /*littleEndian=*/true);
        index += 2;
      } else {
        result.heartRate = value.getUint8(index);
        index += 1;
      }
      let contactDetected = flags & 0x2;
      let contactSensorPresent = flags & 0x4;
      if (contactSensorPresent) {
        result.contactDetected = !!contactDetected;
      }
      let energyPresent = flags & 0x8;
      if (energyPresent) {
        result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
        index += 2;
      }
      let rrIntervalPresent = flags & 0x10;
      if (rrIntervalPresent) {
        let rrIntervals = [];
        for (; index + 1 < value.byteLength; index += 2) {
          rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
        }
        result.rrIntervals = rrIntervals;
      }
      return result;
    }


main()

})();
