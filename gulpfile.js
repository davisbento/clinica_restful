var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var connect = require('gulp-connect');
var rename = require('gulp-rename');

// Minify compiled CSS
gulp.task('minify-css', function () {
    return gulp.src('./src/app/public/css/agency.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    pipe(rename({
        suffix: '.min'
      }))
    .pipe(gulp.dest('./src/app/public/css'));
});


gulp.task('connect', function () {
    connect.server({
        livereload: true,
        port: 4000
    });
});

// Configure the browserSync task
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: './app/views'
        },
    })
});

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'minify-css'], function () {
    // gulp.watch('less/*.less', ['less']);
    gulp.watch('css/*.css', ['minify-css']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload);
});

// Run everything
gulp.task('default', ['connect', 'dev']);