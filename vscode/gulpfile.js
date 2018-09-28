//MAGIC SAUCE BY DREW GAUDERMAN
var gulp = require('gulp'),
	sass = require('gulp-sass')
	del = require('del'),
	uglify = require('gulp-uglify'),
	rename = require("gulp-rename"),
	autoprefixer = require('autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	plumber = require('gulp-plumber'),
	gutil = require('gulp-util'),
	jshint = require('gulp-jshint'), //http://jshint.com/docs/options/
	imagemin = require('gulp-imagemin'),
	browsersync = require('browser-sync'),
	postcss = require('gulp-postcss'),
	cssnano = require('cssnano');

//image folder to automatically resize and move into final folder
var IMG_SRC = './assets/raw/*.+(png|jpg|jpeg|gif|svg)',
	IMG_DIR = './assets/img';

//javascript folder(s) to auto cleanup and minify when saves are detected
var JS_SOURCES = [
	'./assets/js/theme.js',
];
//folder to output cleanedup and minified javascript files
var JS_OUTPUT = './assets/js';

//folder to output sass/theme.scss into
var CSS_OUTPUT = './assets/css';

//extension to give minified css and js files
var MINIFI_PREFIX = '.min';

//show error message
var onError = function (err) {
	gutil.beep();
	console.error(err);
};

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task('bootstrap:scss', function () {
	return gulp.src(['./node_modules/bootstrap/scss/**/*'])
		.pipe(gulp.dest('./assets/scss/bootstrap'));
});

//remove raw bootstrap scss files for assets folder after running
gulp.task('bootstrap:cleanup', function () {
	return del(['assets/scss/bootstrap']);
});

//Compile Sass files
gulp.task('compile:sass', gulp.series('bootstrap:scss', function () {
	return gulp.src('./assets/scss/theme.scss')
		.pipe(plumber({
			errorHandler: onError
		}))

		.pipe(sourcemaps.init()) //start source maps
		.pipe(sass({ //start sass conversion
			errLogToConsole: true,
			outputStyle: 'expanded' //css minify done later
		}).on('error', sass.logError))
		.pipe(sourcemaps.write('./')) //save map file
		.pipe(gulp.dest(CSS_OUTPUT)) //save unmodified css file

		.pipe(postcss([ autoprefixer, cssnano ])) //infix cross browser support and cleanup
		.pipe(rename({suffix: MINIFI_PREFIX})) //change file name

		.pipe(sourcemaps.write('./')) //save map file for compressed css
		.pipe(gulp.dest(CSS_OUTPUT)) //output the cleaned up css file

		.pipe(browsersync.stream()) //update brwoser
	;
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
	;
});

// Image size reducer thingy majigger
gulp.task('watch:images', function () {
	return gulp.src(IMG_SRC)
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(imagemin({
			optimizationLevel: 7,
			progressive: true
		}))
		.pipe(gulp.dest(IMG_DIR))
	;
});

// Remove left over images in the raw folder after doing Image size reducer thingy majigger
gulp.task('cleanimg', function () {
	return del(IMG_SRC);
});

//Start up our magicsause
gulp.task('magicsauce', function () {
	browsersync.init({
		//files: ['./**/*.php'],
		proxy: 'http://site.test/', //local webserver url
		notify: false
	});

	gulp.watch('./assets/scss/*.scss', gulp.series('compile:sass', 'bootstrap:cleanup')); //watch scss folder for changes
	gulp.watch(JS_SOURCES, gulp.series('js:minify')); //watch javascript folder for changes
	gulp.watch(IMG_SRC, gulp.series('watch:images','cleanimg')); //watch raw images folder for changes
	gulp.watch(['./*.php', './*/*.php']).on('change', browsersync.reload); //watch php files for changes to refresh browser
});

/**
 * Default task executed by running `gulp`
 */
gulp.task('default', gulp.series('magicsauce'));