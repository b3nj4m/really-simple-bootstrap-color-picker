$(function() {
  var $elem = $('#color');
  $elem.colorPicker({pickerDefault: '#CCFFFF'});

  $target = $elem.parents('.control-group:first').find('label:first');

  $target.css('color', $elem.val());

  $elem.on('colorPicker:preview colorPicker:change', function(e, value) {
    $target.css('color', value);
  });
});
