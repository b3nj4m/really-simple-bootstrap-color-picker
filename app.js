$(function() {
  var $inputs = $('input.color');
  $inputs.colorPicker({pickerDefault: '#99CCFF'});

  $inputs.each(function(idx, item) {
    var $input = $(item);
    var $target = $input.parents('.control-group:first').find('label:first');
    $target.css('color', $input.val());

    $input.on('colorPicker:preview colorPicker:change', function(e, value) {
      $target.css('color', value);
    });

    $input.on('colorPicker:addSwatch', function(e, value) {
      //do something with custom color (e.g. persist on the server-side)
    });
  });
});
