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

  var isArray = window.Array.isArray || function(obj) {
    return window.toString.call(obj) == '[object Array]';
  };

  /**
   * Create our colorPicker function
  **/
  $.fn.colorPicker = function(options) {
    return this.each(function() {
      $(this).data('colorPicker', new ColorPicker(this, options));
    });
  };

  var ColorPicker = function(input, options) {

    var self = this;

    // Setup time. Clone new elements from our templates, set some IDs, make shortcuts, jazzercise.
    this.element = $(input);
    this.options = $.extend({}, this.defaults, options);
    this.initialColor = this.toHex(this.element.val() || this.options.pickerDefault);
    this.container = this.templates.container.clone();
    this.control = this.templates.control.clone();
    this.palette = this.templates.palette.clone();
    this.hexField = this.templates.hexField.clone();
    this.addSwatchButton = this.templates.addSwatchButton.clone();
    this.paletteId = 'colorPicker-palette-' + uniqueId();

    this.buildPalette(this.options.colors);

    this.palette.attr('id', this.paletteId);

    this.hexField.attr({
      id: 'colorPicker-addSwatchInput-' + uniqueId(),
      value: this.initialColor
    });

    this.hexField.on("keydown", $.proxy(this.hexFieldKeydown, this));
    this.hexField.on("keyup", $.proxy(this.hexFieldKeyup, this));

    this.addSwatchButton.on("click", $.proxy(this.addSwatchClick, this));

    this.element.on("change", $.proxy(this.inputChange, this));
    this.element.val(this.initialColor);

    this.control.css("background-color", this.initialColor);
    this.control.on("click", $.proxy(this.controlClick, this));

    this.container.append(this.hexField);
    this.container.append(this.addSwatchButton);
    this.container.appendTo(this.palette);

    this.palette.hide();
    $(document.body).append(this.palette);

    this.element.before(this.control);
  };

  ColorPicker.prototype.hexFieldKeydown = function(event) {
    if (event.keyCode === 13) {
      var hexColor = this.toHex($(event.target).val());
      this.changeColor(hexColor ? hexColor: this.element.val());
    }
    if (event.keyCode === 27) {
      this.hidePalette();
    }
  };

  ColorPicker.prototype.hexFieldKeyup = function(event) {
    var hexColor = this.toHex($(event.target).val()) || this.element.val();
    this.previewColor(hexColor, false);
  };

  ColorPicker.prototype.createSwatch = function(color) {
    swatch = this.templates.swatch.clone();

    if (color === 'transparent') {
      swatch.text('X');
    }
    else
      color = this.toHex(color);

    swatch.data('color', color);
    swatch.css('background', color);

    swatch.on({
      click: $.proxy(this.swatchClick, this),
      mouseover: $.proxy(this.swatchMouseover, this),
      mouseout: $.proxy(this.swatchMouseout, this)
    });

    return swatch;
  };

  ColorPicker.prototype.addSwatchClick = function(event) {
    var value = this.toHex(this.hexField.val());
    if (value === false || this.options.colors.indexOf(value) !== -1 || this.customColors.indexOf(value) !== -1)
      return;

    var newSwatch = this.createSwatch(value);
    $(event.target).parent().before(newSwatch);

    this.customColors.push(value);

    if (this.supportsLocalStorage) {
      window.localStorage[this.customColorsKey] = window.JSON.stringify(this.customColors);
    }
  };

  ColorPicker.prototype.controlClick = function(event) {
    if (this.element.not(':disabled')) {
      this.togglePalette($('#' + this.paletteId), $(event.target));
    }
  };

  ColorPicker.prototype.inputChange = function(event) {
    var value = this.toHex($(event.target).val());
    this.element.prev(".colorPicker-picker").css("background-color", value);
    this.element.trigger('colorPicker:change', value);
  };

  ColorPicker.prototype.swatchClick = function(event) {
    this.changeColor($(event.target).data('color'));
  };

  ColorPicker.prototype.swatchMouseover = function(event) {
    this.previewColor($(event.target).data('color'));
  };

  ColorPicker.prototype.swatchMouseout = function(event) {
    this.previewColor(this.element.val());
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
    var selectorParent = $(event.target).parents("#" + this.palette.attr('id')).length;

    if (event.target === $(this.palette)[0] || event.target === this.element[0] || selectorParent > 0) {
      return;
    }

    this.hidePalette();
  };

  /**
   * Hide the color palette modal.
  **/
  ColorPicker.prototype.hidePalette = function() {
    //TODO better solution than checkMouse?
    $(document).off("mousedown", $.proxy(this.checkMouse, this));

    this.palette.hide();
  };

  /**
   * Show the color palette modal.
  **/
  ColorPicker.prototype.showPalette = function() {
    var hexColor = this.element.val();

    var offset = this.element.offset();
    this.palette.css({
      top: offset.top + (this.element.outerHeight()),
      left: offset.left
    });

    this.palette.show();

    $(document).on("mousedown", $.proxy(this.checkMouse, this));
  };

  /**
   * Toggle visibility of the colorPicker palette.
  **/
  ColorPicker.prototype.togglePalette = function(palette, origin) {
    if (this.palette.is(':visible')) {
      this.hidePalette();
    } 
    else {
      this.showPalette(palette);

    }
  };

  /**
   * Update the input with a newly selected color.
  **/
  ColorPicker.prototype.changeColor = function(value) {
    this.control.css("background-color", value);
    this.element.val(value).change();

    this.hidePalette();
  };

  /**
   * Preview the input with a newly selected color.
  **/
  ColorPicker.prototype.previewColor = function(value, setHexFieldValue) {
    if (setHexFieldValue === undefined || setHexFieldValue === true)
      this.hexField.val(value);
    this.control.css("background-color", value);
    this.element.trigger('colorPicker:preview', value);
  };

  /**
   * Build a color palette.
  **/
  ColorPicker.prototype.buildPalette = function(colors) {
    var self = this;
    var swatch;
    var callback = function(i, color) {
      swatch = self.createSwatch(color);
      swatch.appendTo(self.palette);
    };

    $.each(colors, callback);
    $.each(this.customColors, callback);
  };

  ColorPicker.prototype.templates = {
    container: $('<div class="colorPicker-addSwatchContainer" />'),
    control: $('<div class="colorPicker-picker add-on">&nbsp;</div>'),
    palette: $('<div class="colorPicker-palette dropdown-menu" />'),
    swatch : $('<div class="colorPicker-swatch">&nbsp;</div>'),
    hexField: $('<input type="text" class="input-small colorPicker-addSwatchInput" />'),
    addSwatchButton: $('<input type="button" class="btn colorPicker-addSwatchButton" value="add" />')
  };

  ColorPicker.prototype.customColorsKey = 'jquery.colorPicker.customColors';

  try {
    ColorPicker.prototype.supportsLocalStorage = ('localStorage' in window && window['localStorage'] !== null);
  }
  catch (err) {
    ColorPicker.prototype.supportsLocalStorage = false;
  }

  try {
    ColorPicker.prototype.supportsJSON = ('JSON' in window && window['JSON'] !== null);
  }
  catch (err) {
    ColorPicker.prototype.supportsJSON = false;
  }

  if (ColorPicker.prototype.supportsLocalStorage && ColorPicker.prototype.supportsJSON) {
    try {
      ColorPicker.prototype.customColors = window.JSON.parse(window.localStorage[ColorPicker.prototype.customColorsKey]);
    }
    catch (err) {
    }
  }
  if (ColorPicker.prototype.customColors === undefined || !isArray(ColorPicker.prototype.customColors)) {
    ColorPicker.prototype.customColors = [];
    window.localStorage[ColorPicker.prototype.customColorsKey] = window.JSON.stringify(ColorPicker.prototype.customColors);
  }

  /**
   * Default colorPicker options.
   *
   * They can be applied on a per-bound element basis like so:
   *
   * $('#element1').colorPicker({pickerDefault: 'efefef', transparency: true});
   * $('#element2').colorPicker({pickerDefault: '333333', colors: ['333333', '111111']});
   *
  **/
  ColorPicker.prototype.defaults = {
    // colorPicker default selected color.
    pickerDefault: "#FFFFFF",

    // Default color set.
    colors: [
      '#000000', '#993300', '#333300', '#000080', '#333399', '#333333', '#800000', '#FF6600',
      '#808000', '#008000', '#008080', '#0000FF', '#666699', '#808080', '#FF0000', '#FF9900',
      '#99CC00', '#339966', '#33CCCC', '#3366FF', '#800080', '#999999', '#FF00FF', '#FFCC00',
      '#FFFF00', '#00FF00', '#00FFFF', '#00CCFF', '#993366', '#C0C0C0', '#FF99CC', '#FFCC99',
      '#FFFF99', '#CCFFFF', '#99CCFF', '#FFFFFF'
    ]
  };

})($);
