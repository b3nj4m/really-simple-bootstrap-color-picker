$(function() {
  var $elem = $('#color');
  $elem.colorPicker({pickerDefault: '#99CCFF'});

  $target = $elem.parents('.control-group:first').find('label:first');

  $target.css('color', $elem.val());

  $elem.on('colorPicker:preview colorPicker:change', function(e, value) {
    $target.css('color', value);
  });

  $elem.on('colorPicker:addSwatch', function(e, value) {
	console.log('added custom swatch with value:', value);
  });
});
