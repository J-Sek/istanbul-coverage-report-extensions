/// <reference path="../typings/index.d.ts" />


$('.coverage-summary .file[data-value]').prepend(`
<i class="fa fa-angle-down" title="Expand/collapse"></i>
<i class="fa fa-folder-open"></i>`);


$('.coverage-summary .file')
    .find('a')
    .text((_, t) => t.match(/\/?([^\/]*)\/$/)[1]);

$('.coverage-summary .file[data-value]')
.toArray()
.map(x => $(x))
.forEach(x => {
    var _i = x.data('value').split('/').length - 2;
    x.css({'padding-left': `${10 + _i * 20}px`});
});

// todo: prevent missing subdirectories, e.g. for:

/*
Scripts/Internal/TrainingEdit/
Scripts/Internal/TrainingEdit/Directives/ActionField/
*/

// todo: replace navigation with "expand leafs" in-place
