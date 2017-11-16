'use strict';

var gulp = require('gulp'),
	plugins = require('gulp-load-plugins')(),
	runSequence = require('run-sequence'),
	config = {
		autoprefix: {
			support: 'last 2 versions, Explorer >= 9, Firefox >= 25'
		},
		deploy: false,
		environment: 'dev',
		dev: {
			base: './src/',
			css: './src/styles/',
			html: './src/',
			js: './src/scripts/',
			static: './src/out/'
		},
		dist: {
			base: './dist/',
			css: './dist/styles/',
			html: './dist/',
			js: './dist/scripts/',
			static: './dist/'
		},
		src: {
			base: './src/',
			css: './src/css/',
			html: './src/',
			js: './src/scripts/',
			static: './src/static/'
		}
	};

plugins.del = require('del');

/* ========================================================================== *\
	GULP TASK IMPORTS
\* ========================================================================== */
require('./gulp/clean')(gulp, config, plugins);
require('./gulp/css')(gulp, config, plugins);
require('./gulp/html')(gulp, config, plugins);
require('./gulp/js')(gulp, config, plugins);
require('./gulp/static-assets')(gulp, config, plugins);
/* == GULP TASK IMPORTS ===================================================== */



/* ========================================================================== *\
	UTILITY TASKS
\* ========================================================================== */
gulp.task('set:deploy', function() {
	'use strict';

	config.deploy = true;
	config.environment = 'dist';
});

gulp.task('webserver', function(taskReady) {
	'use strict';

	gulp.src(config[config.environment].html)
		.pipe(plugins.serverLivereload({
			directoryListing: false,
			livereload: true,
			open: true
		}));
});
/* == UTILITY TASKS ========================================================= */

gulp.task('build', function(taskReady) {
	'use strict';

	runSequence(
		'clean',
		[
			'build:asset:html',
			'build:asset:css',
			'build:asset:js',
			'build:asset:static'
		],
		taskReady
	);
});

gulp.task('deploy', function(taskReady) {
	'use strict';

	runSequence(
		'set:deploy',
		'build',
		taskReady
	);
});

gulp.task('develop', function(taskReady) {
	'use strict';

	runSequence(
		'build',
		[
			'watch:css',
			'watch:html',
			'watch:js',
			'webserver'
		],
		taskReady
	);
});
