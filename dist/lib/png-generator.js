'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _svg2png = require('svg2png');

var _svg2png2 = _interopRequireDefault(_svg2png);

var _faviconGenerator = require('./favicon-generator.js');

var _faviconGenerator2 = _interopRequireDefault(_faviconGenerator);

var _icnsGenerator = require('./icns-generator.js');

var _icnsGenerator2 = _interopRequireDefault(_icnsGenerator);

var _icoGenerator = require('./ico-generator.js');

var _icoGenerator2 = _interopRequireDefault(_icoGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Filter the sizes.
 *
 * @param {Number[]} sizes Original sizes.
 * @param {Number[]} filterSizes Filter sizes.
 *
 * @return {NUmber[]} Filterd sizes.
 */
const filterSizes = (sizes = [], filterSizes = []) => {
  if (filterSizes.length === 0) {
    return sizes;
  }

  return sizes.filter(size => {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = filterSizes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let filterSize = _step.value;

        if (size === filterSize) {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return false;
  });
};

/**
 * Generate the PNG files = require(SVG file.
 */
class PNGGenerator {
  /**
   * Generate the PNG files = require(the SVG file.
   *
   * @param {String} src SVG file path.
   * @param {String} dir Output destination The path of directory.
   * @param {CLIOption} options Options from command line.
   * @param {Function} cb Callback function.
   * @param {Logger} logger Logger.
   */
  static generate(src, dir, options, cb, logger) {
    _fs2.default.readFile(src, (err, svg) => {
      if (err) {
        cb(err);
        return;
      }

      logger.log('SVG to PNG:');

      const sizes = PNGGenerator.getRequiredImageSizes(options);
      Promise.all(sizes.map(size => {
        return PNGGenerator._generatePNG(svg, size, dir, logger);
      })).then(results => {
        cb(null, results);
      }).catch(err2 => {
        cb(err2);
      });
    });
  }

  /**
   * Gets the size of the images needed to create an icon.
   *
   * @param {CLIOption} options Options from command line.
   *
   * @return {Number[]} The sizes of the image.
   */
  static getRequiredImageSizes(options = {}) {
    let sizes = [];
    if (options.modes && 0 < options.modes.length) {
      options.modes.forEach(mode => {
        switch (mode) {
          case 'icns':
            sizes = sizes.concat(filterSizes(_icnsGenerator2.default.getRequiredImageSizes(), options.sizes && options.sizes.icns));
            break;

          case 'ico':
            sizes = sizes.concat(filterSizes(_icoGenerator2.default.getRequiredImageSizes(), options.sizes && options.sizes.ico));
            break;

          case 'favicon':
            sizes = sizes.concat(_faviconGenerator2.default.getRequiredImageSizes());
            break;

          default:
            break;
        }
      });
    }

    // 'all' mode
    if (sizes.length === 0) {
      sizes = _faviconGenerator2.default.getRequiredImageSizes();
      sizes = sizes.concat(filterSizes(_icnsGenerator2.default.getRequiredImageSizes(), options.sizes && options.sizes.icns));
      sizes = sizes.concat(filterSizes(_icoGenerator2.default.getRequiredImageSizes(), options.sizes && options.sizes.ico));
    }

    return sizes.filter((value, index, array) => {
      return array.indexOf(value) === index;
    }).sort((a, b) => {
      // Always ensure the ascending order
      return a - b;
    });
  }

  /**
   * Generate the PNG file = require(the SVG data.
   *
   * @param {Buffer} svg SVG data that has been parse by svg2png.
   * @param {Number} size The size (width/height) of the image.
   * @param {String} dir Path of the file output directory.
   * @param {Logger} logger Logger.
   *
   * @return {Promise} Image generation task.
   */
  static _generatePNG(svg, size, dir, logger) {
    return new Promise((resolve, reject) => {
      if (!(svg && 0 < size && dir)) {
        reject(new Error('Invalid parameters.'));
        return;
      }

      const dest = _path2.default.join(dir, size + '.png');
      logger.log('  Create: ' + dest);

      const buffer = _svg2png2.default.sync(svg, { width: size, height: size });
      if (!buffer) {
        reject(new Error('Faild to write the image, ' + size + 'x' + size));
        return;
      }

      _fs2.default.writeFile(dest, buffer, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ size: size, path: dest });
      });
    });
  }
}
exports.default = PNGGenerator;