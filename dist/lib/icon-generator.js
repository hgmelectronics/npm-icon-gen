'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _pngGenerator = require('./png-generator.js');

var _pngGenerator2 = _interopRequireDefault(_pngGenerator);

var _icoGenerator = require('./ico-generator.js');

var _icoGenerator2 = _interopRequireDefault(_icoGenerator);

var _icnsGenerator = require('./icns-generator.js');

var _icnsGenerator2 = _interopRequireDefault(_icnsGenerator);

var _faviconGenerator = require('./favicon-generator.js');

var _faviconGenerator2 = _interopRequireDefault(_faviconGenerator);

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate an icons.
 */
class IconGenerator {
  /**
   * Generate an icon = require(the SVG file.
   *
   * @param {String} src     Path of the SVG file.
   * @param {String} dir     Path of the output files directory.
   * @param {CLIOption} options Options from command line.
   * @param {Logger} logger  Logger.
   *
   * @return {Promise} Promise object.
   */
  static fromSVG(src, dir, options, logger) {
    return new Promise((resolve, reject) => {
      const svgFilePath = _path2.default.resolve(src);
      const destDirPath = _path2.default.resolve(dir);
      logger.log('Icon generator from SVG:');
      logger.log('  src: ' + svgFilePath);
      logger.log('  dir: ' + destDirPath);

      const workDir = _util2.default.createWorkDir();
      if (!workDir) {
        reject(new Error('Failed to create the working directory.'));
        return;
      }

      _pngGenerator2.default.generate(svgFilePath, workDir, options, (err, images) => {
        if (err) {
          _del2.default.sync([workDir], { force: true });
          reject(err);
          return;
        }

        IconGenerator._generate(images, destDirPath, options, logger, (err2, results) => {
          _del2.default.sync([workDir], { force: true });
          return err2 ? reject(err2) : resolve(results);
        });
      }, logger);
    });
  }

  /**
   * Generate an icon = require(the SVG file.
   *
   * @param {String} src     Path of the PNG files direcgtory.
   * @param {String} dir     Path of the output files directory.
   * @param {Object} options Options.
   * @param {Logger} logger  Logger.
   *
   * @return {Promise} Promise object.
   */
  static fromPNG(src, dir, options, logger) {
    return new Promise((resolve, reject) => {
      const pngDirPath = _path2.default.resolve(src);
      const destDirPath = _path2.default.resolve(dir);
      logger.log('Icon generetor from PNG:');
      logger.log('  src: ' + pngDirPath);
      logger.log('  dir: ' + destDirPath);

      const images = IconGenerator._getRequiredImageSizes(options).map(size => {
        return _path2.default.join(pngDirPath, size + '.png');
      }).map(path => {
        const size = Number(_path2.default.basename(path, '.png'));
        return { path, size };
      });

      let notExistsFile = null;
      images.some(image => {
        const stat = _fs2.default.statSync(image.path);
        if (!(stat && stat.isFile())) {
          notExistsFile = _path2.default.basename(image.path);
          return true;
        }

        return false;
      });

      if (notExistsFile) {
        reject(new Error('"' + notExistsFile + '" does not exist.'));
        return;
      }

      IconGenerator._generate(images, dir, options, logger, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  }

  static _getRequiredImageSizes(options) {
    if (!options.sizes) {
      return _pngGenerator2.default.getRequiredImageSizes(options);
    }

    let imageSizes = [];
    options.modes.forEach(mode => {
      if (options.sizes[mode]) {
        imageSizes = imageSizes.concat(options.sizes[mode]);
      }
    });

    return 0 < imageSizes.length ? imageSizes : _pngGenerator2.default.getRequiredImageSizes(options);
  }

  /**
   * Generate an icon = require(the image file infromations.
   *
   * @param {Array.<ImageInfo>} images  Image file informations.
   * @param {String}            dest    Destination directory path.
   * @param {Object}            options Options.
   * @param {Logger}            logger  Logger.
   * @param {Function}          cb      Callback function.
   */
  static _generate(images, dest, options, logger, cb) {
    if (!(images && 0 < images.length)) {
      cb(new Error('Targets is empty.'));
      return;
    }

    const dir = _path2.default.resolve(dest);
    _mkdirp2.default.sync(dir);

    // Select output mode
    const tasks = [];
    options.modes.forEach(mode => {
      switch (mode) {
        case 'icns':
          tasks.push(_icnsGenerator2.default.generate(images, dir, options, logger));
          break;

        case 'ico':
          tasks.push(_icoGenerator2.default.generate(images, dir, options, logger));
          break;

        case 'favicon':
          tasks.push(_faviconGenerator2.default.generate(images, dir, logger));
          break;

        default:
          break;
      }
    });

    Promise.all(tasks).then(results => {
      cb(null, _util2.default.flattenValues(results));
    }).catch(err => {
      cb(err);
    });
  }

  /**
   * Get the icon sizes.
   *
   * @param {Array.<Number>} defaltSizes Sizes of the defalt.
   * @param {Object}         options     CLI options.
   * @param {String}         type        Type of the icon, 'ico' or 'icns'.
   *
   * @return {Array.<Number>} Sizes.
   */
  static _getSizes(defaltSizes, options, type) {
    return options && options.sizes && options.sizes[type] ? options.sizes[type] : defaltSizes;
  }
}
exports.default = IconGenerator;