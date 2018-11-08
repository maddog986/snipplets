/**
 * Copyright (C) 2018 Drew Gauderman <drew@dpg.host>
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

//javascript folder(s) to auto cleanup and minify when saves are detected
const JS_SOURCES = ["./assets/js/public.js", "./assets/js/private.js", "./assets/js/private-sponsors.js"];
//js files to move over from node_modules
const JS_MOVE = ["./node_modules/jquery/dist/jquery.slim.min.js", "./node_modules/jquery-confirm/dist/jquery-confirm.min.js", "./node_modules/jquery-form-validator/form-validator/jquery.form-validator.min.js", "./node_modules/jquery-datetimepicker/build/jquery.datetimepicker.full.min.js"];
//sass folder to watch for changes
const SASS_FOLDER = "./assets/scss/*.scss";

//css sources
const CSS_SOURCES = ["./assets/scss/public.scss", "./assets/scss/private.scss"];
//css files to move over from node_modules
const CSS_MOVE = ["./node_modules/open-iconic/font/css/open-iconic-bootstrap.min.css", "./node_modules/jquery-confirm/dist/jquery-confirm.min.css", "./node_modules/jquery-datetimepicker/build/jquery.datetimepicker.min.css"];
//font files to move over from node_modules
const FONTS_MOVE = ["./node_modules/open-iconic/font/fonts/*"];
//folder to output cleanedup and minified javascript files
const JS_OUTPUT = "./assets/js";
//folder to output sass/theme.scss into
const CSS_OUTPUT = "./assets/css";
//folder to fonts directory
const FONTS_OUTPUT = "./assets/fonts";
//extension to give minified css and js files
const MINIFI_PREFIX = ".min";
//sass include paths
const SASS_INCLUDE = ["./assets/scss", "./node_modules/bootstrap/scss", "./node_modules/feathericon/build/scss"];
//files to watch for changes to force browser refresh
const WATCH_FILES = ["./**/*.min.css", "./**/*.min.js"];
//files to ignore during watch
const IGNORE_WATCH_FILES = ["*gulpfile.js"];

//declaring all the modules we are about to use
const gulp = require("gulp"),
	sass = require("gulp-sass"),
	uglify = require("gulp-uglify"),
	rename = require("gulp-rename"),
	autoprefixer = require("autoprefixer"),
	sourcemaps = require("gulp-sourcemaps"),
	plumber = require("gulp-plumber"),
	jshint = require("gulp-jshint"), //http://jshint.com/docs/options/
	browsersync = require("browser-sync"), //https://browsersync.io/docs/options
	postcss = require("gulp-postcss"),
	cssnano = require("gulp-cssnano"),
	movemedia = require("css-mqpacker"),
	sort = require("postcss-sorting"), //sort css
	colors = require("postcss-color-rgba-fallback"),
	clone = require("gulp-clone"),
	merge = require("merge-stream"),
	bump = require("gulp-bump"),
	git = require("gulp-git"),
	fs = require("fs");

//Compile Sass files into a nice cleaned up css full file, and minified file.
gulp.task("sass", () => {
	//convert sass into css
	const css = gulp.src(CSS_SOURCES)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass({ outputStyle: "expanded", includePaths: SASS_INCLUDE }).on("error", sass.logError)) //start sass conversion
		.pipe(postcss([autoprefixer, movemedia, colors, sort]));

	//copy css and minif it
	const min = css.pipe(clone())
		.pipe(cssnano()) //minify css
		.pipe(rename({ suffix: MINIFI_PREFIX })); //change file name

	//merge the two, so we can save sourcemap and files seperatly
	return merge(css, min)
		.pipe(sourcemaps.write(".")) //save sourcemaps
		.pipe(gulp.dest(CSS_OUTPUT)) //save files
		.pipe(browsersync.stream());
});

// Minify Javascript files
gulp.task("mini", () => {
	return gulp.src(JS_SOURCES)
		.pipe(plumber())
		.pipe(sourcemaps.init()) //build sourcemaps
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(uglify())
		.pipe(rename({ suffix: MINIFI_PREFIX }))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest(JS_OUTPUT))
		.pipe(browsersync.stream());
});

// Move files to make sure we are using lated version
gulp.task("movefiles", () => {
	return gulp.series(
		gulp.src(CSS_MOVE).pipe(gulp.dest(CSS_OUTPUT)),
		gulp.src(JS_MOVE).pipe(gulp.dest(JS_OUTPUT)),
		gulp.src(FONTS_MOVE).pipe(gulp.dest(FONTS_OUTPUT))
	);
});

//Start up our magicsause
gulp.task("watch", () => {
	browsersync.init({
		//files: ['./**/*.php'],
		proxy: "http://wordpress.test/", //local webserver url
		notify: false,
		files: WATCH_FILES,
		open: false,
		minify: false,
		watchOptions: {
			ignoreInitial: true,
			ignored: IGNORE_WATCH_FILES
		}
	});

	//watch scss folder for changes
	gulp.watch(SASS_FOLDER, gulp.parallel("sass"));

	//watch javascript folder for changes
	gulp.watch(JS_SOURCES, gulp.parallel("mini"));

	// stop gulp with changes detected on gulpfile.js
	gulp.watch("gulpfile.js", process.exit);
});

//update patch version
gulp.task("patch", () => {
	//update version
	return gulp.src("./package.json").pipe(bump({ type: "patch" })).pipe(gulp.dest("./"));
});

//commit all changes
gulp.task("commit", () => {
	// get package
	var version = JSON.parse(fs.readFileSync("./package.json", "utf8")).version;
	var message = `Version ${version}`;

	//commit the files
	return gulp.src(["./"]).pipe(git.add({ args: '--ignore-errors --renormalize' })).pipe(git.commit(message)).on("data", function (err) {
		git.tag(version, message);
	});
});

//push to github
gulp.task("push", (done) => {
	//push to origin
	git.push("origin", "master", function (err) {
		if (err) throw err;
	});

	done(); //signals async
});

//main task to start when developing
gulp.task("default", gulp.series("watch"));

//main task to start when developing
gulp.task("save", gulp.series("patch", "commit", "push"));
