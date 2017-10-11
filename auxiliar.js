function initial-buttons()
{
  // Create element.
  var element = $(
    '<button class="app-start-scan mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-button--disabled">'
  + 'Connect'
  + '</button>'
  + '<button class="app-stop-scan mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-button--disabled">'
  + 'Disconnect'
  + '</button>')

  // Add element.
  $('.app-buttons').html(element);
}