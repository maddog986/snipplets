/**
 * Copyright (C) 2018-2019 Drew Gauderman <drew@dpg.host>
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

//declaring all the modules we are about to use
const gulp = require("gulp"),
	gsass = require("gulp-sass"),
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
	fs = require("fs"),
	pckg = require('./package.json'),
	exec = require('child_process').exec

// open package.json to get settings
const GULPSETTINGS = JSON.parse(fs.readFileSync("./package.json", "utf8")).gulp

if (!GULPSETTINGS) {
	console.log('Package.json missing gulp settings!');
	return;
}

//setup all the tasks
const service = {
	//Compile Sass files into a nice cleaned up css full file, and minified file.
	sass: () => {
		//convert sass into css
		const css = gulp.src(GULPSETTINGS.sass_main)
			.pipe(plumber())
			.pipe(sourcemaps.init())
			.pipe(gsass({
				outputStyle: "expanded",
				includePaths: GULPSETTINGS.sass_include
			}).on("error", gsass.logError)) //start sass conversion
			.pipe(postcss([autoprefixer({
				browsers: pckg.browserslist,
				cascade: false
			}), movemedia, colors, sort]))

		//copy css and minif it
		const min = css.pipe(clone())
			.pipe(cssnano()) //minify css
			.pipe(rename({
				suffix: GULPSETTINGS.minifi_prefix
			})) //change file name

		//merge the two, so we can save sourcemap and files seperatly
		return merge(css, min)
			.pipe(sourcemaps.write(".")) //save sourcemaps
			.pipe(gulp.dest(GULPSETTINGS.css_output)) //save files
			.pipe(browsersync.stream())
	},

	//minifi JS files
	mini: () => {
		return gulp.src(GULPSETTINGS.js_sources)
			.pipe(plumber())
			//.pipe(sourcemaps.init()) //build sourcemaps
			.pipe(jshint())
			.pipe(jshint.reporter("default"))
			.pipe(uglify())
			.pipe(rename({
				suffix: GULPSETTINGS.minifi_prefix
			}))
			//.pipe(sourcemaps.write("./"))
			.pipe(gulp.dest(GULPSETTINGS.js_output))
			.pipe(browsersync.stream())
	},

	//moves 3rd party CSS files from node_modules into assets
	movecss: () => {
		return gulp.src(GULPSETTINGS.css_move).pipe(gulp.dest(GULPSETTINGS.css_output))
	},

	//moves 3rd party JS files from node_modules into assets
	movejs: () => {
		return gulp.src(GULPSETTINGS.js_move).pipe(gulp.dest(GULPSETTINGS.js_output))
	},

	//moves 3rd party fonts from node_modules into assets
	movefonts: () => {
		return gulp.src(GULPSETTINGS.fonts_move).pipe(gulp.dest(GULPSETTINGS.fonts_output))
	},

	//starts up browersync
	webServe: () => {
		browsersync.init({
			proxy: GULPSETTINGS.webserver_url, //local webserver url
			notify: false,
			open: false,
			minify: false
		})
	},

	//watch SCSS & JS for changes
	watch: () => {
		//watch scss folder for changes
		gulp.watch(GULPSETTINGS.sass_watch, gulp.parallel(service.sass))

		//watch javascript folder for changes
		gulp.watch(GULPSETTINGS.js_sources, gulp.parallel(service.mini))

		// stop gulp with changes detected on gulpfile.js
		gulp.watch("gulpfile.js", process.exit)
	},

	//increment patch version in package.json
	patch: () => {
		//update version
		return gulp.src("./package.json").pipe(bump({
			type: "patch"
		})).pipe(gulp.dest("./"))
	},

	//commit all changes to git
	commit: () => {
		// get package
		const version = JSON.parse(fs.readFileSync("./package.json", "utf8")).version
		const message = `Version ${version}`

		//commit the files
		return gulp.src(["./"])
			.pipe(git.add({
				args: '--ignore-errors --renormalize'
			}))
			.pipe(git.commit(message)).on("data", function (err) {
				git.tag(version, message)
			})
	},

	//push to git
	push: (done) => {
		//push to origin
		git.push("origin", "master", function (err) {
			if (err) throw err
		})

		done() //signals async
	},

	//push dist folder to a production branch
	production: (done) => {
		exec('git rev-parse --abbrev-ref HEAD', function (err, stdout, stderr) {
			let branchName = stdout.trim();

			exec(`git subtree push --prefix dist origin ${branchName}-production`, function (err, stdout, stderr) {
				if (stderr) console.log('ERROR:', stderr);

				done(err); //signals async
			});
		});
	}
}

// move css, js and fonts at same time
service.moveall = gulp.parallel(service.movecss, service.movejs, service.movefonts)

//main task to start when developing
service.save = gulp.series(service.patch, service.commit, service.push)

//main task to start when developing
service.default = gulp.parallel(service.webServe, service.watch)

//export all the services
module.exports = service;
