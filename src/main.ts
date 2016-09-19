/// <reference path="../typings/index.d.ts" />

const FILE_PATTERN = /\.(js|coffee|ts|cjs)x?$/;

let $pathCells =  $('.coverage-summary .file[data-value]')
.toArray()
.map($);

$pathCells
.filter(x => !FILE_PATTERN.test(x.data('value')))
.forEach(x => {
    x.prepend(`
        <i class="fa fa-angle-down" title="Expand/collapse"></i>
        <i class="fa fa-folder-open"></i>`);
});

$pathCells
.filter(x => /\.(js|ts)x?$/.test(x.data('value')))
.forEach(x => x.prepend(`<i class="fa fa-code"></i>`));

$pathCells
.filter(x => /\.coffee$/.test(x.data('value')))
.forEach(x => x.prepend(`<i class="fa fa-coffee"></i>`));


$('.coverage-summary .file')
    .find('a')
    .text((_, t) => t.match(/\/?([^\/]*)\/?$/)[1]);

$('.coverage-summary .pct')
    .text((_, t) => /\./.test(t) ? `${Math.round(parseFloat(t.split('%')[0]))}%` : t)

let $pctValues = $('.coverage-summary .pct')
    .toArray()
    .map($);

$pctValues
    .filter(x => x.text() === '0%')
    .forEach(x => x.css({color: 'rgba(194,31,57,0.7)'}));

$pctValues
    .filter(x => x.text() === '100%' && x.next().text() === '0/0')
    .forEach(x => x.text('-'));
    
$pctValues
    .filter(x => parseFloat(x.text().split('%')[0]) > 90)
    .forEach(x => x.css({color: 'rgba(77,146,33,1)'}));


$pathCells
.forEach(x => {
    var _i = x.data('value').split('/').length - 2;
    x.css({'padding-left': `${10 + _i * 20}px`});
});

class TreeNode {
    public static baseLevel = 1;

    constructor(public path: string) {
        var parts = path.split('/');
        this.level = parts.length - TreeNode.baseLevel;
        this.name = parts.pop();
        this.parentPath = parts.join('/');
        this.children = [];
    }
    public name: string;
    public html: string;
    public level: number;
    public parent: TreeNode;
    public parentPath: string;
    public children: TreeNode[];
    public isLeaf() { return this.children.length === 0 }
    public toHtml() {
        this.children.sort((a, b) => a.name.localeCompare(b.name));
        return this.html + this.children.map(x => x.toHtml());
    }
    public findRow() {
        return $(`.file[data-value="${this.path}/"]`).parents('tr');
    }
    public showRow() {
        this.findRow().removeClass('hidden');
    }
    public expandRow() {
        this.findRow().removeClass('collapsed hidden');
        if (this.children.length === 1) {
            this.children[0].expandRow();
        } else {
            this.children.forEach(x => x.showRow());
        }
    }
    public expandAll() {
        this.findRow().removeClass('collapsed hidden');
        this.children.forEach(x => x.expandAll());
    }
    public collapseRow() {
        this.findRow().addClass('collapsed');
        this.children.forEach((x) => x.hideAndCollapseRow());
    }
    public hideAndCollapseRow() {
        this.findRow().addClass('collapsed hidden');
        this.children.forEach((x) => x.hideAndCollapseRow());
    }
}

let getRoot = (paths: string[]): string => {
    var UniqueRoots: string[] = [];
    paths.forEach(n => {
        let root = n.split('/')[0];
        if (UniqueRoots.indexOf(root) < 0) {
            UniqueRoots.push(root);
        }
    });
    return UniqueRoots.length === 1 ? UniqueRoots[0] : '';
}

class FolderStructure {

    private paths: string[];
    private Root: TreeNode;
    private Dict: { [key: string]: TreeNode };
    public static TreeDictionary: { [key: string]: TreeNode }

    public applyChanges() {
        this.scan();
        this.createTreeStructure();
        this.updateSummaryTable();
        this.setEvents();
    }

    private scan() {
        var $table = $('.coverage-summary');
        this.paths = $table
            .find('.file[data-value]')
            .toArray()
            .map($)
            .map(x => x.data('value'))
            .filter(x => !FILE_PATTERN.test(x))
            .map(x => x.replace(/\/$/,''));
    }

    private createTreeStructure() {
        var pathRoot = getRoot(this.paths);
        this.Root = new TreeNode(pathRoot);
        TreeNode.baseLevel = this.Root.level;
        this.Root.level = 0;

        var nodes = this.paths
            .map(x => new TreeNode(x));

        this.Dict = nodes
            .concat(this.Root)
            .reduce(((dict, n) => (dict[n.path] = n) && dict), <any>{});

        FolderStructure.TreeDictionary = this.Dict;

        while (nodes.length > 0) {
            nodes
                .forEach(x => {
                    if (!this.Dict[x.parentPath]) {
                        let parent = new TreeNode(x.parentPath);
                        nodes.push(parent);
                        this.Dict[x.parentPath] = parent;
                    }
                    x.parent = this.Dict[x.parentPath];
                    x.parent.children.push(x);
                });

            nodes = nodes.filter(x => !x.parent);
        }
    }

    private updateSummaryTable() {
        var $table = $('.coverage-summary');
        var columns = $table.find('th').length;
        var $header = $table.find('tr')[0].outerHTML;

        Object.keys(this.Dict)
            .filter(x => x.length > 0)
            .forEach(x => {
                var node = this.Dict[x];
                var $row = node.findRow();

                // $row.attr('data-ns', node.path);

                $row = $row.length ? $row : $(`
                    <tr class="missing-group-row">
                        <td class="file" data-value="${node.path}/" style="padding-left: ${10 + (node.level - 1) * 20}px">
                            <i class="fa fa-angle-down" title="Expand/collapse"></i>
                            <i class="fa fa-folder-open"></i><a>${node.name}</a>
                        </td>
                        <td data-value="0" class="pic low"><div class="chart"><div class="cover-fill" style="width: 1%;"></div><div class="cover-empty" style="width:99%;"></div></div></td>
                        <td data-value="0" class="pct">0</td>
                        <td data-value="0" class="abs">0/0</td>
                        <td data-value="0" class="pct">0</td>
                        <td data-value="0" class="abs">0/0</td>
                        <td data-value="0" class="pct">0</td>
                        <td data-value="0" class="abs">0/0</td>
                        <td data-value="0" class="pct">0</td>
                        <td data-value="0" class="abs">0/0</td>
                    </tr>`);

                // $row.attr('data-ns', node.path);

                if (node.isLeaf()) {
                    $row.addClass('collapsed');
                }

                node.html = $row[0].outerHTML;
            });

        if (this.Root.children.length > 0) {
            $table.html(`<thead>${$header}</thead><tbody>${this.Root.toHtml()}}</tbody`);
        }
    }

    private setEvents() {
        $('.file a')
            .click(e => {
                let pathValue = $(e.currentTarget).parents('.file').data('value');
                let isFile = FILE_PATTERN.test(pathValue);
                if (!isFile) {
                    e.preventDefault();
                }
            });
        
        $('.file')
            .click((e: JQueryEventObject) => { // + debounce
                var $target = $(e.currentTarget);
                var $row = $target.parents('tr');
                var setExpanded = $row.hasClass('collapsed');
                var currentNode = this.Dict[$target.data('value').replace(/\/$/,'')];

                if (e.originalEvent['detail'] > 1) { // double click
                    window.getSelection().removeAllRanges(); // clear selection
                    currentNode.expandAll();
                } else {
                    if (setExpanded) {
                        currentNode.expandRow();
                    } else {
                        currentNode.collapseRow();
                    }
                }
            })
    }
}

(new FolderStructure()).applyChanges();


let sum = (arr, selector: (x:any) => number): number => arr.reduce(((acc, next) => acc + selector(next)), 0);

class FolderStatsFix {

    private paths: string[];
    private Root: TreeNode;
    private Dict: { [key: string]: TreeNode };

    public applyChanges() {
        this.updateSummaryTable();
    }
    
    private statsForColumn (node: TreeNode, column: number) : { all :number, covered :number } {
        let cells = node.findRow().find('td');
        let [covered, all] = cells[column].innerText.split('/').map(x => parseInt(x, 10));

        if (node.isLeaf()) {
            return {all, covered};
        }
        else {
            let childrenStats = node.children.map(x => this.statsForColumn(x, column));
            let childrenStatsSum = {
                all: sum(childrenStats, x => x.all), 
                covered: sum(childrenStats, x => x.covered)
            }
            return {
                all: all + childrenStatsSum.all, 
                covered: covered + childrenStatsSum.covered
            };            
        }
    }

    private updateSummaryTable() {
        Object.keys(FolderStructure.TreeDictionary)
            .filter(x => x.length > 0)
            .map(k => FolderStructure.TreeDictionary[k])
            .filter(node => !node.isLeaf())
            .forEach(node => {
                let $row = node.findRow();
                let cells = $row.find('td');
                
                let statements = this.statsForColumn(node, 3);
                let branches = this.statsForColumn(node, 5);
                let functions = this.statsForColumn(node, 7);
                let lines = this.statsForColumn(node, 9);
                
                let overallResult = (statements.covered / statements.all * 100);
                let overallRoundedResult = Math.round(overallResult);
                $(cells[1])
                    .attr('data-value', overallResult.toFixed(2))
                    .find('.cover-fill').css('width', overallRoundedResult + '%').end()
                    .find('.cover-empty').css('width', (100 - overallRoundedResult) + '%').end()
                    .removeClass('low medium high')
                    .addClass(overallRoundedResult >= 50 ? overallRoundedResult >= 80 ? 'high' : 'medium' : 'low');
                
                cells[2].innerText = statements.all === 0 ? '-' : `${Math.round(statements.covered / statements.all * 100)}%`;
                cells[3].innerText = `${statements.covered}/${statements.all}`;
                
                cells[4].innerText = branches.all === 0 ? '-' : `${Math.round(branches.covered / branches.all * 100)}%`;
                cells[5].innerText = `${branches.covered}/${branches.all}`;
                
                cells[6].innerText = functions.all === 0 ? '-' : `${Math.round(functions.covered / functions.all * 100)}%`;
                cells[7].innerText = `${functions.covered}/${functions.all}`;
                
                cells[8].innerText = lines.all === 0 ? '-' : `${Math.round(lines.covered / lines.all * 100)}%`;
                cells[9].innerText = `${lines.covered}/${lines.all}`;

            });
    }
}

(new FolderStatsFix()).applyChanges();

// todo: load files list and stats
// todo: replace navigation with "expand leafs" in-place
//  .. leave only links to leafs
