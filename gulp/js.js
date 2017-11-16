module.exports = function(gulp, config, plugins) {
	'use strict';

	gulp.task('build:asset:js', function() {
		var paths = config[config.environment];

		return gulp.src(config.src.js + '**/*.js')
			.pipe(plugins.if(config.deploy, plugins.uglify()))
			.pipe(gulp.dest(paths.js));
	});

	gulp.task('watch:js', function() {
		gulp.watch(config.src.js + '**/*.js', ['build:asset:js']);
	});
};
