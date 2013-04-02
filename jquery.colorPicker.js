/**
 * Really Simple Color Picker in jQuery
 *
 * Licensed under the MIT (MIT-LICENSE.txt) licenses.
 *
 * Copyright (c) 2008-2012
 * Lakshan Perera (www.laktek.com) & Daniel Lacy (daniellacy.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function($) {
  var uniqueId = (function() {
    var count = 0;
    return function() {
      return count++;
    };
  }());

  /**
   * Create a couple private variables.
  **/
  var selectorOwner;
  var activePalette;
  var templates = {
    container: $('<div class="colorPicker-addSwatchContainer" />'),
    control: $('<div class="colorPicker-picker add-on">&nbsp;</div>'),
    palette: $('<div class="colorPicker-palette dropdown-menu" />'),
    swatch : $('<div class="colorPicker-swatch">&nbsp;</div>'),
    hexField: $('<input type="text" class="colorPicker-addSwatchInput" />'),
    hexButton: $('<input type="button" class="btn colorPicker-addSwatchButton" />')
  };
  var transparent = "transparent";
  var lastColor;

  /**
   * Create our colorPicker function
  **/
  $.fn.colorPicker = function(options) {
    return this.each(function() {
      var colorPicker = new ColorPicker(this);
      this.data('colorPicker', colorPicker);
    });
  });

  var ColorPicker = function(input) {

    var self = this;

    // Setup time. Clone new elements from our templates, set some IDs, make shortcuts, jazzercise.
    this.element = $(input);
    this.opts = $.extend({}, $.fn.colorPicker.defaults, options);
    this.initialColor = $.fn.colorPicker.toHex(this.element.val() || this.opts.pickerDefault);
    this.container = templates.container.clone();
    this.control = templates.control.clone();
    this.palette = templates.palette.clone();
    this.hexField = templates.hexField.clone();
    this.hexButton = templates.hexButton.clone();
    this.paletteId = 'colorPicker-palette-' + uniqueId();
    this.swatch;

    this.palette.attr('id', paletteId);

    this.hexField.attr({
      id: 'colorPicker-addSwatchInput-' + uniqueId(),
      value: this.initialColor
    });

    /**
     * Build a color palette.
    **/
    $.each(this.opts.colors, function(i) {
      swatch = templates.swatch.clone();

      if (this.opts.colors[i] === transparent) {
        swatch.addClass(transparent).text('X');
        $.fn.colorPicker.bindPalette(self.hexField, swatch, transparent);
      }
      else {
        swatch.css("background-color", "#" + this);
        $.fn.colorPicker.bindPalette(self.hexField, swatch);
      }
      swatch.appendTo(self.palette);
    });

    this.hexField.on("keydown", function(event) {
      if (event.keyCode === 13) {
        var hexColor = $.fn.colorPicker.toHex($(this).val());
        $.fn.colorPicker.changeColor(hexColor ? hexColor: self.element.val());
      }
      if (event.keyCode === 27) {
        $.fn.colorPicker.hidePalette();
      }
    });

    this.hexField.on("keyup", function(event) {
      var hexColor = $.fn.colorPicker.toHex($(event.target).val());
      $.fn.colorPicker.previewColor(hexColor ? hexColor: self.element.val());
    });

    this.hexButton.on("click", function(event) {
      console.log('nope');
    });

    this.container.append(this.hexField);
    this.container.append(this.hexButton);
    this.container.appendTo(this.palette);

    $("body").append(this.palette);

    this.palette.hide();

    /**
     * Build replacement interface for original color input.
    **/
    this.control.css("background-color", this.initialColor);

    this.control.on("click", function() {
      if (self.element.is(':not(:disabled)')) {
        $.fn.colorPicker.togglePalette($('#' + self.paletteId), $(this));
      }
    });

    this.element.before(this.control);

    this.element.on("change", function() {
      var value = $.fn.colorPicker.toHex($(this).val());
      this.element.prev2(".colorPicker-picker").css("background-color", value);
      this.element.trigger('colorPicker:change', value);
    });

    this.element.val(this.initialColor);
  };

  /**
   * Return a Hex color, convert an RGB value and return Hex, or return false.
   *
   * Inspired by http://code.google.com/p/jquery-color-utils
  **/
  ColorPicker.prototype.toHex = function(color) {
    // If we have a standard or shorthand Hex color, return that value.
    if (color.match(/[0-9A-F]{6}|[0-9A-F]{3}$/i)) {
      return (color.charAt(0) === "#") ? color: ("#" + color);

    // Alternatively, check for RGB color, then convert and return it as Hex.
    }
    else if (color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)) {
      var c = ([parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10), parseInt(RegExp.$3, 10)]),
        pad = function(str) {
          if (str.length < 2) {
            for (var i = 0, len = 2 - str.length; i < len; i++) {
              str = '0' + str;
            }
          }

          return str;
        };

      if (c.length === 3) {
        var r = pad(c[0].toString(16)),
          g = pad(c[1].toString(16)),
          b = pad(c[2].toString(16));

        return '#' + r + g + b;
      }

    // Otherwise we wont do anything.
    }
    else {
      return false;
    }
  };

  /**
   * Check whether user clicked on the selector or owner.
  **/
  ColorPicker.prototype.checkMouse = function(event, paletteId) {
    var selector = activePalette;
    var selectorParent = $(event.target).parents("#" + selector.attr('id')).length;

    if (event.target === $(selector)[0] || event.target === selectorOwner[0] || selectorParent > 0) {
      return;
    }

    $.fn.colorPicker.hidePalette();
  };

  /**
   * Hide the color palette modal.
  **/
  ColorPicker.prototype.hidePalette = function() {
    $(document).off("mousedown", $.fn.colorPicker.checkMouse);

    $('.colorPicker-palette').hide();
  };

  /**
   * Show the color palette modal.
  **/
  ColorPicker.prototype.showPalette = function(palette) {
    var hexColor = selectorOwner.next("input").val();

    palette.css({
      top: selectorOwner.offset().top + (selectorOwner.outerHeight()),
      left: selectorOwner.offset().left
    });

    $("#color_value").val(hexColor);

    palette.show();

    $(document).on("mousedown", $.fn.colorPicker.checkMouse);
  };

  /**
   * Toggle visibility of the colorPicker palette.
  **/
  ColorPicker.prototype.togglePalette = function(palette, origin) {
    // selectorOwner is the clicked .colorPicker-picker.
    if (origin) {
      selectorOwner = origin;
    }

    activePalette = palette;

    if (activePalette.is(':visible')) {
      $.fn.colorPicker.hidePalette();

    } 
    else {
      $.fn.colorPicker.showPalette(palette);

    }
  };

  /**
   * Update the input with a newly selected color.
  **/
  ColorPicker.prototype.changeColor = function(value) {
    selectorOwner.css("background-color", value);
    selectorOwner.next("input").val(value).change();

    $.fn.colorPicker.hidePalette();

    selectorOwner.data('onColorChange').call(selectorOwner, $(selectorOwner).next("input").attr("id"), value);
  };

  /**
   * Preview the input with a newly selected color.
  **/
  ColorPicker.prototype.previewColor = function(value) {
    selectorOwner.css("background-color", value);
    //TODO emit colorPicker:preview when previewing a color
  };

  /**
   * Bind events to the color palette swatches.
  */
  ColorPicker.prototype.bindPalette = function(paletteInput, element, color) {
    color = color ? color: $.fn.colorPicker.toHex(element.css("background-color"));

    element.on({
      click: function(ev) {
        lastColor = color;

        $.fn.colorPicker.changeColor(color);
      },
      mouseover: function(ev) {
        lastColor = paletteInput.val();

        $(this).css("border-color", "#598FEF");

        paletteInput.val(color);

        $.fn.colorPicker.previewColor(color);
      },
      mouseout: function(ev) {
        $(this).css("border-color", "#000");

        paletteInput.val(selectorOwner.css("background-color"));

        paletteInput.val(lastColor);

        $.fn.colorPicker.previewColor(lastColor);
      }
    });
  };

  /**
   * Default colorPicker options.
   *
   * These are publibly available for global modification using a setting such as:
   *
   * $.fn.colorPicker.defaults.colors = ['151337', '111111']
   *
   * They can also be applied on a per-bound element basis like so:
   *
   * $('#element1').colorPicker({pickerDefault: 'efefef', transparency: true});
   * $('#element2').colorPicker({pickerDefault: '333333', colors: ['333333', '111111']});
   *
  **/
  ColorPicker.prototype.defaults = {
    // colorPicker default selected color.
    pickerDefault: "FFFFFF",

    // Default color set.
    colors: [
      '000000', '993300', '333300', '000080', '333399', '333333', '800000', 'FF6600',
      '808000', '008000', '008080', '0000FF', '666699', '808080', 'FF0000', 'FF9900',
      '99CC00', '339966', '33CCCC', '3366FF', '800080', '999999', 'FF00FF', 'FFCC00',
      'FFFF00', '00FF00', '00FFFF', '00CCFF', '993366', 'C0C0C0', 'FF99CC', 'FFCC99',
      'FFFF99', 'CCFFFF', '99CCFF', 'FFFFFF'
    ]
  };

})(jQuery);
