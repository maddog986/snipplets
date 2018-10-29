/**
 * Copyright 2018 Drew Gauderman
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

//MAGIC SAUCE BY DREW GAUDERMAN
const gulp = require('gulp'),
	sass = require('gulp-sass'),
	uglify = require('gulp-uglify'),
	rename = require("gulp-rename"),
	autoprefixer = require('autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	plumber = require('gulp-plumber'),
	jshint = require('gulp-jshint'), //http://jshint.com/docs/options/
	browsersync = require('browser-sync'), //https://browsersync.io/docs/options
	postcss = require('gulp-postcss'),
	cssnano = require('gulp-cssnano'),
	movemedia = require('css-mqpacker'),
	sort = require('postcss-sorting'), //sort css
	colors = require('postcss-color-rgba-fallback'),
	clone = require('gulp-clone'),
	merge = require('merge-stream'),
	php = require('gulp-connect-php') //https://fettblog.eu/php-browsersync-grunt-gulp/
;

//look into this later: https://andy-carter.com/blog/automatically-load-gulp-plugins-with-gulp-load-plugins

//javascript folder(s) to auto cleanup and minify when saves are detected
var JS_SOURCES = [
	'./assets/js/public.js',
	'./assets/js/private.js',
];
//css sources
var CSS_SOURCES = [
	'./assets/scss/public.scss',
	'./assets/scss/private.scss'
];

//folder to output cleanedup and minified javascript files
var JS_OUTPUT = './assets/js';

//folder to output sass/theme.scss into
var CSS_OUTPUT = './assets/css';

//folder to fonts directory
var FONTS_OUTPUT = './assets/fonts';

//extension to give minified css and js files
var MINIFI_PREFIX = '.min';

//show error message
var onError = function (err) {
	//console.error(err);
};

//Compile Sass files into a nice cleaned up css full file, and minified file.
gulp.task('compile:sass', gulp.series(function () {
	//convert sass into css
	const css = gulp.src(CSS_SOURCES)
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [
				'./assets/scss',
				'./node_modules/bootstrap/scss',
				'./node_modules/feathericon/build/scss'
			]
		}).on('error', sass.logError)) //start sass conversion
		.pipe(postcss([autoprefixer, movemedia, colors, sort]));

	//copy css and minif it
	const min = css.pipe(clone())
		.pipe(cssnano()) //minify css
		.pipe(rename({
			suffix: MINIFI_PREFIX
		})) //change file name
	;

	//merge the two, so we can save sourcemap and files seperatly
	return merge(css, min)
		.pipe(sourcemaps.write('.')) //save sourcemaps
		.pipe(gulp.dest(CSS_OUTPUT)) //save files
		.pipe(browsersync.stream());;
}));

// Minify Javascript files
gulp.task('js:minify', function () {
	return gulp.src(JS_SOURCES)
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(sourcemaps.init()) //build sourcemaps
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(uglify())
		.pipe(rename({
			suffix: MINIFI_PREFIX
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(JS_OUTPUT))
		.pipe(browsersync.stream());;
});

// Move files to make sure we are using lated version
gulp.task('movefiles', function () {
	gulp.src([
			'./node_modules/open-iconic/font/css/open-iconic-bootstrap.css',
			'./node_modules/open-iconic/font/css/open-iconic-bootstrap.min.css',
			'./node_modules/jquery-confirm/dist/jquery-confirm.min.css'
		])
		.pipe(gulp.dest(CSS_OUTPUT));

	gulp.src([
			'./node_modules/jquery/dist/jquery.slim.min.js',
			'./node_modules/jquery-confirm/dist/jquery-confirm.min.js',
			'./node_modules/jquery-form-validator/form-validator/jquery.form-validator.min.js',
			'./node_modules/jquery-datetimepicker/build/jquery.datetimepicker.full.min.js'
		])
		.pipe(gulp.dest(JS_OUTPUT));

	return gulp.src([
			'./node_modules/open-iconic/font/fonts/*'
		])
		.pipe(gulp.dest(FONTS_OUTPUT));
});

//Start up our magicsause
gulp.task('magicsauce', function () {
	browsersync.init({
		//files: ['./**/*.php'],
		proxy: 'http://wordpress.test/', //local webserver url
		notify: false,
		files: ['./**/*.min.css', './**/*.php', './**/*.html', './**/*.png', './**/*.min.js'],
		open: false,
		minify: false,
		watchOptions: {
			ignoreInitial: true,
			ignored: ['*.txt', '*.map', '*.json', '*.md', '*gulpfile.js', 'php_test']
		},
	});

	gulp.watch('./assets/scss/*.scss', gulp.parallel('compile:sass')); //watch scss folder for changes
	gulp.watch(JS_SOURCES, gulp.parallel('js:minify')); //watch javascript folder for changes

	// stop gulp with changes detected on gulpfile.js
	gulp.watch('gulpfile.js', process.exit);
});

//runs a php dev server for testing
gulp.task('phpdev', function () {
	//start php server in php_test directory
	php.server({
		base: 'php_test',
		port: 8010,
		keepalive: true
	});
});

/**
 * Default task executed by running `gulp`
 */
gulp.task('default', gulp.series('magicsauce'));

gulp.task('phpdev', gulp.series('phpdev'));

gulp.task('movefiles', gulp.series('movefiles'));
