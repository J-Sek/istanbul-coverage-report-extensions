/// <reference path="../typings/index.d.ts" />

let $pathCells =  $('.coverage-summary .file[data-value]')
.toArray()
.map(x => $(x));

$pathCells
.filter(x => !/\.(js|coffee|ts)x?$/.test(x.data('value')))
.forEach(x => {
    x.prepend(`
        <i class="fa fa-angle-down" title="Expand/collapse"></i>
        <i class="fa fa-folder-open"></i>`);
});

$pathCells
.filter(x => /\.(js|ts)x?$/.test(x.data('value')))
.forEach(x => {
    x.prepend(`
        <i class="fa fa-code"></i>`);
});

$pathCells
.filter(x => /\.coffee$/.test(x.data('value')))
.forEach(x => {
    x.prepend(`
        <i class="fa fa-coffee"></i>`);
});


$('.coverage-summary .file')
    .find('a')
    .text((_, t) => t.match(/\/?([^\/]*)\/?$/)[1]);

$pathCells
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
