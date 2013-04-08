$(function() {
  var defaultValue = '#000000';

  var $elem = $('#color');
  $elem.colorPicker({pickerDefault: defaultValue});

  $target = $elem.parents('.control-group:first').find('label:first');

  $target.css('color', defaultValue);

  $elem.on('colorPicker:preview colorPicker:change', function(evnt, value) {
    $target.css('color', value);
  });
});
